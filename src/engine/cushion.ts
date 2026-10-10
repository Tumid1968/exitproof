/**
 * Cushion before blockage: the largest amount another holder can withdraw first while the target
 * holder's full exit still succeeds. Found by bisection, each probe executed on the fork from the
 * pristine snapshot (withdraw x by the other holder, then full redeem by the target).
 */
import type { Address } from "viem";
import { ScenarioRunner } from "./scenario.ts";

export type CushionResult = { otherHolder: Address; precisionWei: string; passesAt: string; revertsAt: string; probes: { amount: string; targetExitOk: boolean }[] };

export async function findCushion(runner: ScenarioRunner, vault: Address, target: Address, other: Address, hiWei: bigint, precisionWei = 10n ** 15n): Promise<CushionResult> {
  const probes: CushionResult["probes"] = [];
  const tryAmount = async (x: bigint) => {
    const r = await runner.run({
      id: "cushion_probe", title: "", hypotheses: [], target: { vault, holder: target },
      actions: [
        ...(x > 0n ? [{ type: "exit" as const, vault, owner: other, action: { kind: "withdrawAssets" as const, assets: x.toString() } }] : []),
        { type: "exit" as const, vault, owner: target, action: { kind: "redeemAll" as const } },
      ],
    });
    const last = r.results[r.results.length - 1];
    const ok = last.type === "exit" && last.result.ok;
    probes.push({ amount: x.toString(), targetExitOk: ok });
    return ok;
  };
  let lo = 0n, hi = hiWei;
  if (!(await tryAmount(lo))) throw new Error("target cannot exit even alone");
  if (await tryAmount(hi)) return { otherHolder: other, precisionWei: precisionWei.toString(), passesAt: hi.toString(), revertsAt: "none", probes };
  // Round to the precision grid so the search is reproducible.
  lo = 0n; hi = (hi / precisionWei) * precisionWei + precisionWei;
  while (hi - lo > precisionWei) {
    const mid = ((lo + hi) / 2n / precisionWei) * precisionWei;
    if (mid === lo || mid === hi) break;
    if (await tryAmount(mid)) lo = mid; else hi = mid;
  }
  return { otherHolder: other, precisionWei: precisionWei.toString(), passesAt: lo.toString(), revertsAt: hi.toString(), probes };
}
