/**
 * Acceptance on the fork (needs `npm run proxy` + `npm run fork`): the reference values established
 * during preparation must come out of this engine to the wei, with the T0 + 12k timestamp convention.
 */
import { test, before } from "node:test";
import assert from "node:assert/strict";
import { ForkEngine } from "../src/engine/fork.ts";
import { ScenarioRunner } from "../src/engine/scenario.ts";
import { findCushion } from "../src/engine/cushion.ts";
import { ACTORS } from "../src/lib/constants.ts";
import type { Address } from "viem";

const V = ACTORS.steakhouseEth;
let runner: ScenarioRunner;
before(async () => {
  const eng = new ForkEngine();
  await eng.init();
  runner = new ScenarioRunner(eng);
});

const runA = async (pre: { vault: Address; owner: Address }[]) => {
  const r = await runner.run({
    id: "t", title: "", hypotheses: [], target: { vault: V, holder: ACTORS.A },
    actions: [...pre.map((p) => ({ type: "exit" as const, vault: p.vault, owner: p.owner, action: { kind: "redeemAll" as const } })),
      { type: "exit" as const, vault: V, owner: ACTORS.A, action: { kind: "redeemAll" as const } }],
  });
  const last = r.results[r.results.length - 1];
  if (last.type !== "exit") throw new Error("unexpected");
  return last.result;
};

test("A alone receives 5209.914854809315636083 WETH", async () => {
  const a = await runA([]);
  assert.equal(a.ok, true);
  assert.equal(a.assetsOutWei, "5209914854809315636083");
});

test("B first: A's full exit reverts NotEnoughLiquidity, max 4210.679414346963425094", async () => {
  const a = await runA([{ vault: V, owner: ACTORS.B }]);
  assert.equal(a.ok, false);
  assert.equal(a.error?.selector, "0x4323a555");
  assert.equal(a.ownerMaxWithdrawBeforeWei, "4210679414346963425094");
});

test("C, D, C+D first: no effect on A", async () => {
  assert.equal((await runA([{ vault: V, owner: ACTORS.C }])).assetsOutWei, "5209914887726757695954");
  assert.equal((await runA([{ vault: V, owner: ACTORS.D }])).assetsOutWei, "5209914885076858124432");
  assert.equal((await runA([{ vault: V, owner: ACTORS.C }, { vault: V, owner: ACTORS.D }])).assetsOutWei, "5209914922808437709168");
});

test("B then C: max 3489.008199441496936870", async () => {
  assert.equal((await runA([{ vault: V, owner: ACTORS.B }, { vault: V, owner: ACTORS.C }])).ownerMaxWithdrawBeforeWei, "3489008199441496936870");
});

test("cross-vault: Vault Bridge #1 exits its own vault -> A max 3318.751556034097893931 (-36%)", async () => {
  assert.equal((await runA([{ vault: ACTORS.vaultBridgeWeth, owner: ACTORS.VB1 }])).ownerMaxWithdrawBeforeWei, "3318751556034097893931");
});

test("B exits both vaults -> A max 2079.210741633111021926 (-60%)", async () => {
  assert.equal((await runA([{ vault: ACTORS.gauntletWethPrime, owner: ACTORS.B }, { vault: V, owner: ACTORS.B }])).ownerMaxWithdrawBeforeWei, "2079210741633111021926");
});

test("cushion: passes at 1736.990, reverts at 1736.991", async () => {
  const c = await findCushion(runner, V, ACTORS.A, ACTORS.B, 2_736_000_000_000_000_000_000n);
  assert.equal(c.passesAt, "1736990000000000000000");
  assert.equal(c.revertsAt, "1736991000000000000000");
});
