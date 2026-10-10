/**
 * Historical reference for the stETH depeg incident: the Chainlink stETH/ETH feed, read once at the frozen
 * source block (getRoundData of every round of every phase; no archive state needed), sampled daily
 * (last round of each UTC day), and summarised. Written to results/history/steth-eth.json with a sha256,
 * then read from the file by the site (no network in the static version).
 *
 * The market oracle of the wstETH markets does NOT use this feed (it uses the wstETH/stETH exchange rate);
 * it is read only as a record of how far stETH traded below ETH in the past. A reference, not a forecast.
 *
 * Usage: tsx src/cli/history.ts   (needs the RPC proxy: npm run proxy)
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { decodeFunctionResult, encodeFunctionData, parseAbi, type Address, type Hex } from "viem";
import { rpc } from "../lib/rpc.ts";
import { ADDR, PROXY_URL, SOURCE } from "../lib/constants.ts";
import { chainlinkFeedAbi } from "../lib/abis.ts";
import { toJson } from "../lib/util.ts";

const FEED = "0x86392dC19c0b719886221c78AB11eb8Cf5c52812" as Address; // Chainlink stETH / ETH proxy (verified below)
const SIZES = [0.01, 0.03, 0.05, 0.1, 0.15, 0.2];
const WINDOW_DAYS = 30;
const DAY = 86_400;
const block = "0x" + SOURCE.block.toString(16);

const proxyAbi = parseAbi(["function phaseId() view returns (uint16)", "function phaseAggregators(uint16) view returns (address)"]);
const aggAbi = parseAbi(["function latestRound() view returns (uint256)"]);
const mcAbi = parseAbi(["function aggregate3((address target, bool allowFailure, bytes callData)[] calls) payable returns ((bool success, bytes returnData)[] returnData)"]);

async function call<T>(to: Address, abi: any, fn: string, args: unknown[] = []): Promise<T> {
  const data = encodeFunctionData({ abi, functionName: fn, args } as any);
  const out = await rpc<Hex>(PROXY_URL, "eth_call", [{ to, data }, block]);
  return decodeFunctionResult({ abi, functionName: fn, data: out } as any) as T;
}

async function rounds(ids: bigint[]) {
  const calls = ids.map((id) => ({ target: FEED, allowFailure: true, callData: encodeFunctionData({ abi: chainlinkFeedAbi, functionName: "getRoundData", args: [id] }) }));
  const data = encodeFunctionData({ abi: mcAbi, functionName: "aggregate3", args: [calls] });
  const out = await rpc<Hex>(PROXY_URL, "eth_call", [{ to: ADDR.multicall3, data }, block]);
  const res = decodeFunctionResult({ abi: mcAbi, functionName: "aggregate3", data: out }) as readonly { success: boolean; returnData: Hex }[];
  return res.map((r, i) => {
    if (!r.success || r.returnData === "0x") return null;
    const [roundId, answer, , updatedAt] = decodeFunctionResult({ abi: chainlinkFeedAbi, functionName: "getRoundData", data: r.returnData }) as readonly [bigint, bigint, bigint, bigint, bigint];
    return updatedAt === 0n ? null : { roundId: roundId.toString(), id: ids[i], answer, updatedAt: Number(updatedAt) };
  }).filter((x) => x !== null);
}

const description = await call<string>(FEED, chainlinkFeedAbi, "description");
const decimals = await call<number>(FEED, chainlinkFeedAbi, "decimals");
if (!/steth\s*\/\s*eth/i.test(description)) throw new Error(`unexpected feed at ${FEED}: "${description}"`);
const phase = await call<number>(FEED, proxyAbi, "phaseId");
const all: { roundId: string; answer: bigint; updatedAt: number }[] = [];
const phases: { phase: number; aggregator: Address; rounds: number }[] = [];
for (let p = 1; p <= phase; p++) {
  const agg = await call<Address>(FEED, proxyAbi, "phaseAggregators", [p]);
  if (/^0x0+$/.test(agg)) continue;
  const latest = await call<bigint>(agg, aggAbi, "latestRound");
  const ids = Array.from({ length: Number(latest) }, (_, i) => (BigInt(p) << 64n) | BigInt(i + 1));
  let n = 0;
  for (let i = 0; i < ids.length; i += 250) { const got = await rounds(ids.slice(i, i + 250)); all.push(...got); n += got.length; }
  phases.push({ phase: p, aggregator: agg, rounds: n });
  console.log(`phase ${p}: aggregator ${agg}, ${n} rounds`);
}
all.sort((a, b) => a.updatedAt - b.updatedAt);
const until = Number(SOURCE.timestamp);
const usable = all.filter((r) => r.updatedAt <= until);

// daily sample: last round updated before the end of each UTC day
const scale = 10 ** decimals;
const firstDay = Math.floor(usable[0].updatedAt / DAY) * DAY;
const days: { date: string; price: number; roundId: string }[] = [];
let j = 0;
for (let d = firstDay; d + DAY <= until; d += DAY) {
  while (j + 1 < usable.length && usable[j + 1].updatedAt < d + DAY) j++;
  if (usable[j].updatedAt >= d + DAY) continue;
  days.push({ date: new Date(d * 1000).toISOString().slice(0, 10), price: Number(usable[j].answer) / scale, roundId: usable[j].roundId });
}

/** nearest-rank percentile of x (0..1) */
const pctl = (xs: number[], q: number) => { const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.max(0, Math.ceil(q * s.length) - 1))]; };
const p = days.map((d) => d.price);
const drop1 = p.slice(1).map((x, i) => Math.max(0, 1 - x / p[i]));
// drop over 30 days: from the window's first daily price to its lowest daily price in the next 30 days
const dropFrom = (i: number) => { let m = p[i]; for (let k = i + 1; k <= Math.min(p.length - 1, i + WINDOW_DAYS); k++) m = Math.min(m, p[k]); return Math.max(0, 1 - m / p[i]); };
const drop30 = p.slice(0, p.length - WINDOW_DAYS).map((_, i) => dropFrom(i));
const windows = Array.from({ length: Math.floor((p.length - 1) / WINDOW_DAYS) }, (_, w) => ({ start: days[w * WINDOW_DAYS].date, drop: dropFrom(w * WINDOW_DAYS) }));
const worst = windows.reduce((a, b) => (b.drop > a.drop ? b : a));
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

// ---- intraday: every round, not only the daily sample. Drop in a span = largest fall from a peak to a later trough,
// starting from the price in force at the span's start (last round before it).
const pr = usable.map((x) => Number(x.answer) / scale), ts = usable.map((x) => x.updatedAt);
/** index of the last round updated at or before t */
const at = (t: number) => { let lo = 0, hi = ts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (ts[m] <= t) lo = m; else hi = m - 1; } return lo; };
function fallIn(t0: number, t1: number) {
  let i = at(t0), peak = pr[i], drop = 0, from = ts[i], to = ts[i], peakT = ts[i];
  for (i = i + 1; i < ts.length && ts[i] < t1; i++) {
    if (pr[i] > peak) { peak = pr[i]; peakT = ts[i]; }
    const d = 1 - pr[i] / peak;
    if (d > drop) { drop = d; from = peakT; to = ts[i]; }
  }
  return { drop, from, to };
}
const dayStart = days.map((d) => Date.parse(d.date + "T00:00:00Z") / 1000);
const drop1i = dayStart.slice(1).map((t) => fallIn(t, t + DAY).drop);
const drop30i = dayStart.slice(0, dayStart.length - WINDOW_DAYS).map((t) => fallIn(t, t + WINDOW_DAYS * DAY).drop);
const windowsI = Array.from({ length: windows.length }, (_, w) => { const t = dayStart[w * WINDOW_DAYS]; const f = fallIn(t, t + WINDOW_DAYS * DAY); return { start: days[w * WINDOW_DAYS].date, ...f }; });
const worstI = windowsI.reduce((a, b) => (b.drop > a.drop ? b : a));
const isoT = (t: number) => new Date(t * 1000).toISOString().replace(".000", "");

/**
 * 10 October 2025 (a day of very large liquidations across crypto markets): every round of the feed from
 * 9 Oct 00:00 UTC to 13 Oct 00:00 UTC, not only the daily sample. "Before" = last round updated before the
 * end of 9 Oct (UTC). Feed reading only: it says nothing about how any vault behaved.
 */
function oct10() {
  const from = Date.UTC(2025, 9, 9) / 1000, endOf9 = Date.UTC(2025, 9, 10) / 1000, to = Date.UTC(2025, 9, 13) / 1000;
  const iso = (t: number) => new Date(t * 1000).toISOString().replace(".000", "");
  const before = [...usable].reverse().find((x) => x.updatedAt < endOf9)!;
  const win = usable.filter((x) => x.updatedAt >= from && x.updatedAt < to);
  const after = win.filter((x) => x.updatedAt >= endOf9);
  const px = (x: { answer: bigint }) => Number(x.answer) / scale;
  const min = after.reduce((a, b) => (px(b) < px(a) ? b : a), before);
  // largest peak-to-trough fall between consecutive-or-later rounds inside the window (before included)
  let peak = before, worst = { drop: 0, from: before, to: before };
  for (const x of [before, ...after]) { if (px(x) > px(peak)) peak = x; const d = 1 - px(x) / px(peak); if (d > worst.drop) worst = { drop: d, from: peak, to: x }; }
  // the fall itself: first round more than 0.5 % (the feed's deviation threshold) below "before", then back within 0.5 %
  const firstMove = after.find((x) => px(x) < px(before) * 0.995) ?? min;
  const recovered = after.find((x) => x.updatedAt > min.updatedAt && px(x) >= px(before) * 0.995) ?? null;
  // what the daily sample used for the k-of-N counts recorded that day
  const d9 = days.find((d) => d.date === "2025-10-09"), d10 = days.find((d) => d.date === "2025-10-10");
  return {
    id: "2025-10-10", title: "What stETH did on Oct 10, 2025",
    fall: { firstMoveAt: iso(firstMove.updatedAt), firstMovePrice: round6(px(firstMove)), secondsFirstMoveToMin: min.updatedAt - firstMove.updatedAt,
      backWithinHalfPercentAt: recovered ? iso(recovered.updatedAt) : null, secondsMinToRecovery: recovered ? recovered.updatedAt - min.updatedAt : null },
    dailySample: d9 && d10 ? { oct9: round6(d9.price), oct10: round6(d10.price), drop: round6(Math.max(0, 1 - d10.price / d9.price)), note: "the daily samples behind the k-of-N counts miss intraday moves" } : null,
    vsOneDayP99: round6(Math.max(0, 1 - px(min) / px(before)) / pctl(drop1i, 0.99)),
    note: "Chainlink feed reading, not a DEX price. Shows how the stETH/ETH feed moved on a day of very large liquidations; it does not say how any vault behaved.",
    window: { from: iso(from), to: iso(to), roundsInWindow: win.length },
    before: { price: round6(px(before)), updatedAt: iso(before.updatedAt), roundId: before.roundId },
    min: { price: round6(px(min)), updatedAt: iso(min.updatedAt), roundId: min.roundId },
    dropFromBefore: round6(Math.max(0, 1 - px(min) / px(before))), secondsBeforeToMin: min.updatedAt - before.updatedAt,
    largestFallInWindow: { drop: round6(worst.drop), from: iso(worst.from.updatedAt), to: iso(worst.to.updatedAt), seconds: worst.to.updatedAt - worst.from.updatedAt },
    rounds: [before, ...after].map((x) => [x.roundId, iso(x.updatedAt), round6(px(x))]),
  };
}

const body = {
  schema: "exitproof-history/1",
  what: "Chainlink stETH/ETH feed, every round, read at the source block. Not used by the market oracle; a historical reference, not a forecast. The feed may update only every 24 h when the price is calm, and it is not a DEX price.",
  feed: { address: FEED, description, decimals, phases },
  source: { chainId: 1, block: SOURCE.block.toString(), timestamp: SOURCE.timestamp.toString(), method: "getRoundData of every round (multicall3, eth_call at the source block); daily sample = last round updated before the end of each UTC day" },
  period: { from: days[0].date, to: days[days.length - 1].date, days: days.length, rounds: usable.length },
  method: "intraday: every round of the feed; the drop in a span is the largest fall from a peak to a later trough, starting from the price in force at the span's start",
  drops: {
    oneDay: { p95: round6(pctl(drop1i, 0.95)), p99: round6(pctl(drop1i, 0.99)), max: round6(Math.max(...drop1i)), samples: drop1i.length, note: "each UTC day" },
    thirtyDays: { p95: round6(pctl(drop30i, 0.95)), p99: round6(pctl(drop30i, 0.99)), max: round6(Math.max(...drop30i)), samples: drop30i.length, note: "overlapping 30-day spans starting each UTC day (percentiles only)" },
    definition: "drop = largest fall from a peak to a later trough within the span, using every feed round; percentiles by nearest rank",
  },
  windows: {
    days: WINDOW_DAYS, count: windowsI.length, note: "non-overlapping 30-day windows from the first daily sample date",
    bySize: SIZES.map((s) => ({ size: s, k: windowsI.filter((w) => w.drop >= s).length, n: windowsI.length, kDailySample: windows.filter((w) => w.drop >= s).length })),
    worst: { start: worstI.start, drop: round6(worstI.drop), peakAt: isoT(worstI.from), troughAt: isoT(worstI.to) },
  },
  comparison: {
    dailySample: {
      what: "previous method, kept for comparison: last round of each UTC day; drop = from the window's first daily price to its lowest daily price",
      oneDay: { p95: round6(pctl(drop1, 0.95)), p99: round6(pctl(drop1, 0.99)), max: round6(Math.max(...drop1)) },
      thirtyDays: { p95: round6(pctl(drop30, 0.95)), p99: round6(pctl(drop30, 0.99)), max: round6(Math.max(...drop30)) },
      bySize: SIZES.map((s) => ({ size: s, k: windows.filter((w) => w.drop >= s).length, n: windows.length })),
      worst: { start: worst.start, drop: round6(worst.drop) },
    },
  },
  daily: days.map((d) => [d.date, round6(d.price)]),
  events: [oct10()],
};
const json = toJson(body);
const out = { ...body, sha256: createHash("sha256").update(json).digest("hex") };
mkdirSync("results/history", { recursive: true });
writeFileSync("results/history/steth-eth.json", toJson(out));
console.log(`${description}: ${days.length} days ${body.period.from} → ${body.period.to}; ${windows.length} windows; k by size:`, body.windows.bySize.map((x) => `${x.size * 100}%: ${x.k}/${x.n}`).join(", "));
console.log("intraday 1-day", body.drops.oneDay, "30-day", body.drops.thirtyDays, "worst window", body.windows.worst);
console.log("daily sample (old):", body.comparison.dailySample.bySize.map((x) => `${x.size * 100}%: ${x.k}`).join(", "), body.comparison.dailySample.oneDay, body.comparison.dailySample.worst);
