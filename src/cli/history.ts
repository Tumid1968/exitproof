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

const body = {
  schema: "exitproof-history/1",
  what: "Chainlink stETH/ETH feed, daily samples, read at the source block. Not used by the market oracle; a historical reference, not a forecast.",
  feed: { address: FEED, description, decimals, phases },
  source: { chainId: 1, block: SOURCE.block.toString(), timestamp: SOURCE.timestamp.toString(), method: "getRoundData of every round (multicall3, eth_call at the source block); daily sample = last round updated before the end of each UTC day" },
  period: { from: days[0].date, to: days[days.length - 1].date, days: days.length, rounds: usable.length },
  drops: {
    oneDay: { p95: round6(pctl(drop1, 0.95)), p99: round6(pctl(drop1, 0.99)), max: round6(Math.max(...drop1)), samples: drop1.length },
    thirtyDays: { p95: round6(pctl(drop30, 0.95)), p99: round6(pctl(drop30, 0.99)), max: round6(Math.max(...drop30)), samples: drop30.length, note: "overlapping windows stepped by one day (percentiles only)" },
    definition: "drop = 1 − lowest daily price in the window ÷ daily price at the window start (0 if it never fell); percentiles by nearest rank",
  },
  windows: {
    days: WINDOW_DAYS, count: windows.length, note: "non-overlapping 30-day windows from the first daily sample",
    bySize: SIZES.map((s) => ({ size: s, k: windows.filter((w) => w.drop >= s).length, n: windows.length })),
    worst: { start: worst.start, drop: round6(worst.drop) },
  },
  daily: days.map((d) => [d.date, round6(d.price)]),
};
const json = toJson(body);
const out = { ...body, sha256: createHash("sha256").update(json).digest("hex") };
mkdirSync("results/history", { recursive: true });
writeFileSync("results/history/steth-eth.json", toJson(out));
console.log(`${description}: ${days.length} days ${body.period.from} → ${body.period.to}; ${windows.length} windows; k by size:`, body.windows.bySize.map((x) => `${x.size * 100}%: ${x.k}/${x.n}`).join(", "));
console.log("1-day drop p95/p99", body.drops.oneDay, "30-day", body.drops.thirtyDays, "worst window", body.windows.worst);
