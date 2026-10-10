/**
 * Stay-or-exit decision for one position.
 *
 *   Stay  : expected loss = p * L_incident
 *   Exit  : cost = forgone yield on the exited amount over the horizon + gas (out and back in) + measured slippage
 *           + p * (share of the loss still borne by what could NOT be exited now)
 *   Break-even probability p* : the p where both are equal = exitCost / (L_incident * exitableShare)
 *
 * L_incident = value loss of the position in the incident (bad debt recognised on-chain, or economic
 * shortfall if the oracle is blind) + haircut * part of the position still locked after the incident run.
 * p is the user's own assumption, never a prediction.
 */
export type VerdictInputs = {
  positionValue: bigint;          // holder's assets at source (convertToAssets)
  exitableNow: bigint;            // executed on fork: what the holder actually receives exiting now
  incidentValueLoss: bigint;      // value lost by the position in the incident
  incidentLocked: bigint;         // position value still not withdrawable after the incident run
  lockedHaircut: number;          // 0..1, user: how much a locked unit is worth losing to you
  netApy: number;                 // vault net APY (supply APY after performance fee), from on-chain reads
  horizonDays: number;
  gasCostOut: bigint;             // gasUsed (fork) * baseFee (source block header)
  gasCostReentry: bigint;
  slippage: bigint;               // positionValue-implied minus received, if positive (measured)
  probability: number;            // user's incident probability over the horizon
};

export type Verdict = {
  decision: "EXIT" | "STAY" | "NO_ACTION_POSSIBLE";
  sentence: string;
  breakEvenProbability: number | null;
  expectedLossStay: number;
  expectedLossExit: number;
  exitCost: number;
  incidentLoss: number;
  exitableShare: number;
  parts: Record<string, number>;
};

const n = (x: bigint) => Number(x) / 1e18;

export function decide(i: VerdictInputs, unit = "WETH"): Verdict {
  const V = n(i.positionValue);
  const W = Math.min(n(i.exitableNow), V);
  const share = V === 0 ? 0 : W / V;
  const L = n(i.incidentValueLoss) + i.lockedHaircut * n(i.incidentLocked);
  const forgone = W * i.netApy * (i.horizonDays / 365);
  const exitCost = forgone + n(i.gasCostOut) + n(i.gasCostReentry) + n(i.slippage);
  const stay = i.probability * L;
  const exit = exitCost + i.probability * L * (1 - share);
  const avoidable = L * share;
  const pStar = avoidable > 0 ? exitCost / avoidable : null;
  const f = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const pct = (x: number) => (x * 100).toLocaleString("en-US", { maximumSignificantDigits: 3 }) + "%";
  let decision: Verdict["decision"];
  let sentence: string;
  if (W === 0) {
    decision = "NO_ACTION_POSSIBLE";
    sentence = `Nothing can be withdrawn now: exit is not an option at this block.`;
  } else if (pStar === null) {
    decision = "STAY";
    sentence = `This incident causes no loss to the position under these assumptions: exiting only costs ${f(exitCost)} ${unit}.`;
  } else if (pStar > 1) {
    decision = "STAY";
    sentence = `STAY: even if this incident were certain within ${i.horizonDays} days, exiting would cost more (${f(exitCost)} ${unit}) than the loss it avoids (${f(avoidable)} ${unit}).`;
  } else if (i.probability > pStar) {
    decision = "EXIT";
    sentence = `EXIT: you assume a ${pct(i.probability)} chance of this incident within ${i.horizonDays} days, above the break-even ${pct(pStar)}. Expected loss if you stay ${f(stay)} ${unit} vs ${f(exit)} ${unit} if you exit${share < 1 ? ` (only ${pct(share)} of the position can leave now)` : ""}.`;
  } else {
    decision = "STAY";
    sentence = `STAY: you assume a ${pct(i.probability)} chance of this incident within ${i.horizonDays} days, below the break-even ${pct(pStar)}. Exiting costs ${f(exitCost)} ${unit} for an expected avoided loss of ${f(i.probability * avoidable)} ${unit}.`;
  }
  return {
    decision, sentence, breakEvenProbability: pStar, expectedLossStay: stay, expectedLossExit: exit, exitCost, incidentLoss: L, exitableShare: share,
    parts: { forgoneYield: forgone, gasOut: n(i.gasCostOut), gasReentry: n(i.gasCostReentry), slippage: n(i.slippage), valueLoss: n(i.incidentValueLoss), lockedAfterRun: n(i.incidentLocked) },
  };
}

/** The verdict works in 18-decimal units; rescale amounts of other assets (USDC: 6 decimals). */
export function scaleTo18(i: VerdictInputs, decimals: number): VerdictInputs {
  if (decimals === 18) return i;
  const f = 10n ** BigInt(18 - decimals);
  return { ...i, positionValue: i.positionValue * f, exitableNow: i.exitableNow * f, incidentValueLoss: i.incidentValueLoss * f, incidentLocked: i.incidentLocked * f, slippage: i.slippage * f, gasCostOut: i.gasCostOut * f, gasCostReentry: i.gasCostReentry * f };
}
