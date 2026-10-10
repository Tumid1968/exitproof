/**
 * The exit at the user's own size, from results already measured (static) or from a fork simulation (live).
 *  - static ("scaled from the measured case"): what gets out right away in the worst executed case =
 *    min(amount, liquidity left for the holder in that case); the rest waits. Amounts above the largest measured
 *    position are capped to it.
 *  - live ("simulated on the fork"): the caller passes what actually got out and the gas actually used.
 * The break-even uses the same decide() as the report, with the incident's inputs at this size (value loss pro
 * rata, locked cost only on the part that waits after the incident run, gas measured or the report's default).
 * At the largest measured position the result is the report's, unchanged.
 */
import { decide, scaleTo18 } from "./verdict.ts";
import { pctChange } from "./pct.ts";
import { answerLevel, answerWord } from "./answer.ts";

/** "1,000.5" → smallest units; null if empty, not a number, negative or with too many decimals. */
export function parseAmount(s: string, decimals: number): bigint | null {
  const t = s.replace(/[\s,_]/g, "");
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  const [i, f = ""] = t.split(".");
  if (f.length > decimals) return null;
  return BigInt(i) * 10n ** BigInt(decimals) + BigInt((f + "0".repeat(decimals)).slice(0, decimals) || "0");
}

export type LiveMeasure = { exitNow: bigint; gasCostOut: bigint; gasCostReentry: bigint };
export type SizeCase = {
  amount: bigint; capped: boolean; now: bigint; wait: bigint; changePct: number;
  word: string; level: "easy" | "tight" | "hard"; worstShare: number;
  breakEven10: number | null; breakEven0: number | null; noAction: boolean;
};

const min = (a: bigint, b: bigint) => (a < b ? a : b);
const max = (a: bigint, b: bigint) => (a > b ? a : b);

export function sizeCase(r: any, worstRunId: string, amountIn: bigint, live?: LiveMeasure): SizeCase {
  const pos = BigInt(r.target.holderValue);
  const run = r.runs.find((x: any) => x.id === worstRunId);
  const alone = r.runs[0];
  const capped = !live && amountIn > pos;
  const A = capped ? pos : amountIn;
  const atMeasured = A === pos;
  const now = live ? live.exitNow : min(A, BigInt(run.holderExecutedExit));
  const wait = max(0n, A - now);
  const aloneAvail = BigInt(r.vault.withdrawableNow);
  const aloneNow = atMeasured ? BigInt(alone.holderExecutedExit) : min(A, aloneAvail);
  const aloneFull = atMeasured ? !!alone.fullExitOk : A <= aloneAvail;
  const worstShare = A === 0n ? 0 : Number((now * 10000n) / A) / 10000;
  // break-even at this size, same function and inputs as the report
  const inc = r.incidents?.find((i: any) => i.id === r.bindingIncident);
  const vp = r.verdictParams;
  const be = (haircut: number) => {
    if (!inc || A === 0n) return { p: null as number | null, none: false };
    const I = inc.inputs, posV = BigInt(I.positionValue);
    const afterRun = BigInt(inc.executedFacts.holderMaxWithdrawAfterRun);
    const inputs = {
      positionValue: A,
      exitableNow: atMeasured ? BigInt(I.exitableNow) : min((A * BigInt(I.exitableNow)) / posV, aloneAvail),
      incidentValueLoss: (BigInt(I.incidentValueLoss) * A) / posV,
      incidentLocked: atMeasured ? BigInt(I.incidentLocked) : max(0n, A - afterRun),
      lockedHaircut: haircut, netApy: vp.netApy, horizonDays: 30,
      gasCostOut: live ? live.gasCostOut : BigInt(vp.gasCostOut),
      gasCostReentry: live ? live.gasCostReentry : BigInt(vp.gasCostReentry),
      slippage: (BigInt(vp.slippage) * A) / posV, probability: vp.defaults?.probability ?? 0.05,
    };
    const v = decide(scaleTo18(inputs, r.target.assetDecimals), r.target.assetSymbol);
    return { p: v.breakEvenProbability, none: v.decision === "NO_ACTION_POSSIBLE" };
  };
  const b10 = be(0.1), b0 = be(0);
  return {
    amount: A, capped, now, wait, changePct: pctChange(now, aloneNow),
    word: answerWord(aloneFull, worstShare), level: answerLevel(aloneFull, worstShare), worstShare,
    breakEven10: b10.p, breakEven0: b0.p, noAction: b10.none,
  };
}
