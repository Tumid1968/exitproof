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
