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

const WSTETH_ORACLE = "0xbD60A6770b27E084E8617335ddE769241B0e71D8" as Address;
const priceOf = async () => (await import("../src/lib/rpc.ts")).rpc<string>("http://127.0.0.1:8545", "eth_call", [{ to: WSTETH_ORACLE, data: "0xa035b1fe" }, "latest"]);

test("a scenario that fails right after an oracle override leaves no shocked oracle behind", async () => {
  const before = await priceOf();
  await assert.rejects(runner.run({
    id: "t_fail", title: "", hypotheses: [], target: { vault: V, holder: ACTORS.A },
    actions: [
      { type: "oraclePrice", oracle: WSTETH_ORACLE, num: "1", den: "2" },
      // a market id that does not exist: liquidation setup throws
      { type: "liquidateAll", marketId: ("0x" + "00".repeat(31) + "01") as `0x${string}`, borrowers: [] },
    ],
  }));
  assert.equal(await priceOf(), before);
});

test("an override orphaned by a killed process is restored by the next run", async () => {
  const { rpc } = await import("../src/lib/rpc.ts");
  const { writeFileSync, readFileSync } = await import("node:fs");
  const before = await priceOf();
  // simulate a crash: code replaced and recorded, never restored
  let prev: string[] = [];
  try { prev = JSON.parse(readFileSync("cache/fork-code-overrides.json", "utf8")); } catch { /* none */ }
  writeFileSync("cache/fork-code-overrides.json", JSON.stringify([...new Set([...prev, WSTETH_ORACLE])]));
  await rpc("http://127.0.0.1:8545", "hardhat_setCode", [WSTETH_ORACLE, "0x7f" + "1".padStart(64, "0") + "60005260206000f3"]);
  assert.notEqual(await priceOf(), before);
  const fresh = new ScenarioRunner(new ForkEngine());
  await (fresh as unknown as { eng: ForkEngine }).eng.init();
  await fresh.run({ id: "t_noop", title: "", hypotheses: [], target: { vault: V, holder: ACTORS.A }, actions: [{ type: "measure", label: "x" }] });
  assert.equal(await priceOf(), before);
});
