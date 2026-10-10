/** Phase 0 acceptance: A alone, B then A (full exit), B then A (max). */
import { formatEther } from "viem";
import { ForkEngine } from "../engine/fork.ts";
import { ACTORS } from "../lib/constants.ts";

const V = ACTORS.steakhouseEth;
const eng = new ForkEngine();
console.log(await eng.init());
const t0 = Date.now();
const branches = [
  await eng.runBranch("A_alone", [{ vault: V, owner: ACTORS.A, action: { kind: "redeemAll" } }]),
  await eng.runBranch("B_then_A_full", [
    { vault: V, owner: ACTORS.B, action: { kind: "redeemAll" } },
    { vault: V, owner: ACTORS.A, action: { kind: "redeemAll" } },
  ]),
  await eng.runBranch("B_then_A_max", [
    { vault: V, owner: ACTORS.B, action: { kind: "redeemAll" } },
    { vault: V, owner: ACTORS.A, action: { kind: "withdrawMax" } },
  ]),
];
for (const b of branches) {
  console.log(`\n== ${b.id}`);
  for (const s of b.steps)
    console.log(` k=${s.k} ${s.owner.slice(0, 8)} ${s.call} ok=${s.ok} out=${formatEther(BigInt(s.assetsOutWei))} maxW_before=${s.ownerMaxWithdrawBeforeWei} out_wei=${s.assetsOutWei} ${s.error ? s.error.selector + " " + s.error.name : ""}`);
}
console.log(`\n${Date.now() - t0} ms`);
