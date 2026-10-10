/** Pure tests (no network, no fork): verdict arithmetic and Morpho liquidation incentive factor. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { decide, scaleTo18 } from "../src/verdict/verdict.ts";
import { lifWad } from "../src/shocks/analytic.ts";
import { decodeRevert } from "../src/engine/decode.ts";

const E = 10n ** 18n;
const base = {
  positionValue: 1000n * E, exitableNow: 1000n * E, incidentValueLoss: 100n * E, incidentLocked: 0n, lockedHaircut: 0,
  netApy: 0.0365, horizonDays: 100, gasCostOut: 0n, gasCostReentry: 0n, slippage: 0n, probability: 0.05,
};

test("break-even = exit cost / avoidable loss", () => {
  // forgone yield = 1000 * 3.65% * 100/365 = 10 ; avoidable loss = 100 -> p* = 10%
  const v = decide(base);
  assert.ok(Math.abs(v.exitCost - 10) < 1e-9);
  assert.ok(Math.abs((v.breakEvenProbability ?? 0) - 0.1) < 1e-9);
  assert.equal(v.decision, "STAY");
  assert.equal(decide({ ...base, probability: 0.2 }).decision, "EXIT");
});

test("partial exit: only the exitable share avoids the loss", () => {
  const v = decide({ ...base, exitableNow: 500n * E });
  // forgone on 500 = 5 ; avoidable = 100 * 0.5 = 50 -> 10%
  assert.ok(Math.abs((v.breakEvenProbability ?? 0) - 0.1) < 1e-9);
  assert.ok(Math.abs(v.exitableShare - 0.5) < 1e-12);
});

test("locked funds count through the user's haircut", () => {
  const v = decide({ ...base, incidentLocked: 400n * E, lockedHaircut: 0.25 });
  assert.ok(Math.abs(v.incidentLoss - 200) < 1e-9);
});

test("break-even above 100% means stay even if the incident is certain", () => {
  const v = decide({ ...base, incidentValueLoss: 1n * E });
  assert.equal(v.decision, "STAY");
  assert.match(v.sentence, /even if this incident were certain/);
});

test("less than 1% exitable -> no action possible", () => {
  const v = decide({ ...base, exitableNow: 5n * E });
  assert.equal(v.decision, "NO_ACTION_POSSIBLE");
  assert.match(v.sentence, /practically impossible/);
});

test("nothing exitable -> no action possible", () => {
  assert.equal(decide({ ...base, exitableNow: 0n }).decision, "NO_ACTION_POSSIBLE");
});

test("6-decimal assets are rescaled", () => {
  const six = scaleTo18({ ...base, positionValue: 1000n * 10n ** 6n, exitableNow: 1000n * 10n ** 6n, incidentValueLoss: 100n * 10n ** 6n }, 6);
  assert.equal(six.positionValue, 1000n * E);
  assert.deepEqual(decide(six).breakEvenProbability, decide(base).breakEvenProbability);
});

test("Morpho liquidation incentive factor", () => {
  // LIF = min(1.15, 1 / (0.3 * LLTV + 0.7))
  const f = (l: number) => Number(lifWad(BigInt(Math.round(l * 1e18)))) / 1e18;
  assert.ok(Math.abs(f(0.965) - 1 / (0.3 * 0.965 + 0.7)) < 1e-12);
  assert.ok(Math.abs(f(0.86) - 1 / (0.3 * 0.86 + 0.7)) < 1e-12);
  assert.equal(f(0), 1.15);
});

test("revert decoding never invents a cause", () => {
  assert.equal(decodeRevert("0x4323a555", "").name, "NotEnoughLiquidity()");
  assert.equal(decodeRevert("0xdeadbeef", "").name, "unrecognised");
  assert.equal(decodeRevert(undefined, "boom").name, "unknown");
});

test("percentage changes are rounded, not truncated", async () => {
  const { pctChange } = await import("../src/lib/util.ts");
  const alone = 5209914854809315636083n;
  assert.equal(pctChange(4210679414346963425094n, alone), -19.18);
  assert.equal(pctChange(3318751556034097893931n, alone), -36.3);
  assert.equal(pctChange(2079210741633111021926n, alone), -60.09);
  assert.equal(pctChange(alone, alone), 0);
  assert.equal(pctChange(105n, 100n, 2), 5);
  assert.equal(pctChange(1n, 3n, 2), -66.67);
});

test("concentration index and regimes (derived indicators)", async () => {
  const { hhi, hhiWord, regimeOf } = await import("../src/refine/refine.ts");
  assert.equal(hhi([1, 1, 1, 1]), 0.25);
  assert.equal(hhi([5]), 1);
  assert.equal(hhi([]), 0);
  assert.equal(hhiWord(0.25), "concentrated");
  assert.equal(hhiWord(0.2), "moderately concentrated");
  assert.equal(hhiWord(0.1), "diversified");
  assert.equal(regimeOf("wstETH", "WETH"), "pegged");
  assert.equal(regimeOf("cbBTC", "WETH"), "volatile");
  assert.equal(regimeOf("sUSDe", "DAI"), "pegged");
  assert.equal(regimeOf("wstETH", "USDC"), "volatile");
  assert.equal(regimeOf("WBTC", "cbBTC"), "pegged");
  assert.equal(regimeOf("PT-unknown", "USDC"), "volatile");
});

test("historical reference file: sha256 matches and counts are k of N", async () => {
  const { readFileSync } = await import("node:fs");
  const { createHash } = await import("node:crypto");
  const { toJson } = await import("../src/lib/util.ts");
  const h = JSON.parse(readFileSync("results/history/steth-eth.json", "utf8"));
  const { sha256, ...body } = h;
  assert.equal(createHash("sha256").update(toJson(body)).digest("hex"), sha256);
  for (const x of h.windows.bySize) { assert.equal(x.n, h.windows.count); assert.ok(x.k >= 0 && x.k <= x.n); }
  const ks = h.windows.bySize.map((x: { k: number }) => x.k);
  assert.deepEqual([...ks].sort((a, b) => b - a), ks, "k must not increase with the shock size");
});

test("one-word answer: limits stated, applied to the worst executed case", async () => {
  const { answerWord, ANSWER_LIMITS } = await import("../src/refine/refine.ts");
  assert.deepEqual(ANSWER_LIMITS, { safe: 0.9, careful: 0.5 });
  assert.equal(answerWord(true, 1), "Safe");
  assert.equal(answerWord(true, 0.9), "Safe");
  assert.equal(answerWord(true, 0.899), "Careful");
  assert.equal(answerWord(true, 0.5), "Careful");
  assert.equal(answerWord(true, 0.399), "Risky");
  assert.equal(answerWord(false, 1), "Risky");
});
