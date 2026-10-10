/**
 * Derived indicators, computed once from results already executed or read (reports, graphs, history) and
 * written to results/refine/<vault>.json. Nothing here re-executes a scenario or changes an existing number:
 *  - link to the historical reference of the decisive incident's shock (stETH depeg only, see cli/history.ts)
 *  - governance window: vault timelock and guardian (read on-chain during discovery)
 *  - exit window: can the position leave now (executed "alone" run)
 *  - vault-level loss of the decisive incident, compared with Credora's 1 % significant-loss definition
 *  - withdraw-queue concentration (Herfindahl index) by market and by collateral
 *  - market utilization vs Gauntlet's published 90 % watch level
 *  - two shock regimes (pegged 10 %, volatile 40 %) through the existing analytic engine, no new simulation code
 */
import { readFileSync, existsSync } from "node:fs";
import type { Address } from "viem";
import { loadGraph } from "../discovery/load.ts";
import { propagate, type Shock } from "../shocks/analytic.ts";
import type { DependencyGraph } from "../discovery/types.ts";

/** Herfindahl–Hirschman index of weights (normalised to sum 1). */
export function hhi(values: number[]) {
  const t = values.reduce((a, b) => a + b, 0);
  return t <= 0 ? 0 : values.reduce((a, v) => a + (v / t) ** 2, 0);
}
/** Words for an HHI, thresholds of the US DOJ/FTC merger guidelines (2010): 0.15 and 0.25. */
export const hhiWord = (h: number) => (h >= 0.25 ? "concentrated" : h >= 0.15 ? "moderately concentrated" : "diversified");

/** Asset family by symbol; same family as the loan asset = pegged regime, otherwise volatile. */
export function family(sym: string): "ETH" | "USD" | "BTC" | "EUR" | null {
  const s = sym.toUpperCase();
  if (/BTC/.test(s)) return "BTC";
  if (/EUR/.test(s)) return "EUR";
  if (/ETHX?$/.test(s) || /STETH/.test(s)) return "ETH";
  if (/(USD|DAI|GHO|FRAX|USR|USDS|USDE|USDC|USDT)/.test(s)) return "USD";
  return null;
}
export function regimeOf(collateral: string, loan: string): "pegged" | "volatile" {
  const a = family(collateral), b = family(loan);
  return a !== null && a === b ? "pegged" : "volatile";
}
export const REGIMES = { pegged: 0.9, volatile: 0.6 } as const; // price factor: −10 % / −40 %

const WATCH_UTILIZATION = 0.9;
/** limits of the one-word answer (share of the largest deposit that comes out in the worst executed case) */
export const ANSWER_LIMITS = { safe: 0.9, careful: 0.5 } as const;
/** colour level of the word (same thresholds) */
export function answerLevel(aloneFull: boolean, worstShare: number) {
  return ({ "Easy exit": "easy", "Tight exit": "tight", "Hard exit": "hard" } as const)[answerWord(aloneFull, worstShare)];
}
export function answerWord(aloneFull: boolean, worstShare: number) {
  return !aloneFull || worstShare < ANSWER_LIMITS.careful ? "Hard exit" : worstShare < ANSWER_LIMITS.safe ? "Tight exit" : "Easy exit";
}
const round6 = (x: number) => Math.round(x * 1e6) / 1e6;

export function buildRefine(vault: Address) {
  const r = JSON.parse(readFileSync(`results/reports/${vault}.json`, "utf8"));
  const g: DependencyGraph = loadGraph(vault);
  const vaultNode = g.nodes.find((n) => n.kind === "vault")!;
  const guardian = g.nodes.find((n) => n.kind === "governance" && n.data?.role === "guardian");
  const timelock = Number(vaultNode.data.timelockSeconds ?? NaN);
  const loanSym = r.target.assetSymbol as string;
  const totalAssets = BigInt(r.vault.totalAssets);

  // 1. historical reference (only for the stETH depeg incident; shock size from the scenario catalog: factor 0.9)
  const binding = r.incidents.find((i: any) => i.id === r.bindingIncident) ?? null;
  const stethIncident = binding && /^Incident: stETH depegs/.test(binding.title);
  const histFile = "results/history/steth-eth.json";
  const history = stethIncident && existsSync(histFile) ? (() => {
    const h = JSON.parse(readFileSync(histFile, "utf8"));
    return { file: histFile, sha256: h.sha256, incidentShockSize: 0.1, sizeSource: "scenario catalog: market price x0.9" };
  })() : null;

  // 3. governance and exit window
  const alone = r.runs[0];
  const exitWindow = alone.fullExitOk
    ? { kind: "immediate", share: 1 }
    : { kind: "partial", share: Number((BigInt(alone.holderExecutedExit) * 10000n) / BigInt(r.target.holderValue)) / 10000 };
  const governance = {
    timelockSeconds: Number.isFinite(timelock) ? timelock : null,
    timelockDays: Number.isFinite(timelock) ? round6(timelock / 86400) : null,
    guardian: guardian ? { address: guardian.address, kind: guardian.label.replace(/ \(guardian\)$/, "") } : null,
    source: "read on-chain during discovery (vault timelock(), guardian())",
  };

  // 4a. vault-level loss of the decisive incident (pro rata: holder loss ÷ holder value = vault loss ÷ vault assets)
  const vaultLevel = binding ? (() => {
    const loss = BigInt(binding.inputs.incidentValueLoss), pos = BigInt(binding.inputs.positionValue);
    const ratio = pos === 0n ? 0 : Number((loss * 1_000_000n) / pos) / 1_000_000;
    return { incident: binding.id, ratio, vaultLossAssets: ((totalAssets * loss) / (pos || 1n)).toString(), basis: binding.valueSource, threshold: 0.01, aboveThreshold: ratio > 0.01 };
  })() : null;

  // 4b. withdraw-queue concentration and utilization
  const funded = g.markets.filter((m) => m.vaultSupplyAssets > 0n);
  const toNum = (x: bigint) => Number(x) / 10 ** r.target.assetDecimals;
  const byMarket = funded.map((m) => ({ id: m.id, queueIndex: m.queueIndex, collateral: m.collateralSymbol, vaultSupply: m.vaultSupplyAssets.toString(),
    utilization: m.totalSupplyAssets === 0n ? 0 : Number((m.totalBorrowAssets * 10000n) / m.totalSupplyAssets) / 10000 }));
  const groups = new Map<string, number>();
  for (const m of funded) groups.set(m.collateralSymbol, (groups.get(m.collateralSymbol) ?? 0) + toNum(m.vaultSupplyAssets));
  const hMarkets = hhi(funded.map((m) => toNum(m.vaultSupplyAssets)));
  const hColl = hhi([...groups.values()]);
  const concentration = {
    byMarket: { hhi: round6(hMarkets), word: hhiWord(hMarkets), n: funded.length },
    byCollateral: { hhi: round6(hColl), word: hhiWord(hColl), groups: [...groups.entries()].map(([k, v]) => ({ collateral: k, share: round6(v / [...groups.values()].reduce((a, b) => a + b, 0)) })) },
    thresholds: "HHI ≥ 0.25 concentrated, 0.15–0.25 moderately concentrated, < 0.15 diversified (US DOJ/FTC 2010 guidelines); weights = vault supply per market, idle market (no collateral) included",
  };
  const utilization = { watchLevel: WATCH_UTILIZATION, watchSource: "Gauntlet VaultBook (90 % utilization watch level; the 48-hour duration is not measured here)",
    markets: byMarket.filter((m) => m.collateral !== "none").map((m) => ({ queueIndex: m.queueIndex, collateral: m.collateral, utilization: m.utilization, aboveWatch: m.utilization >= WATCH_UTILIZATION })) };

  // 5. two shock regimes, existing analytic engine; markets where the vault has funds only
  const exposed = funded.filter((m) => m.collateralSymbol !== "none");
  const regimes = (["pegged", "volatile"] as const).map((regime) => {
    const ms = exposed.filter((m) => regimeOf(m.collateralSymbol, loanSym) === regime);
    const exposure = ms.reduce((a, m) => a + m.vaultSupplyAssets, 0n);
    const factor = REGIMES[regime];
    const shocks = [...new Set(ms.map((m) => m.params.collateralToken))].map((c) => {
      const sym = ms.find((m) => m.params.collateralToken === c)!.collateralSymbol;
      const s: Shock = { kind: "blindDepeg", collateral: c, factor, label: `${sym} market price x${factor} (oracle unchanged: economic shortfall)` };
      const res = propagate(g, s);
      return { collateral: sym, label: s.label, vaultLoss: res.vaultLoss.toString(), vaultHiddenLoss: res.vaultHiddenLoss.toString(),
        vaultLossRatio: round6(Number(((res.vaultLoss + res.vaultHiddenLoss) * 1_000_000n) / (totalAssets || 1n)) / 1_000_000) };
    });
    return { regime, shockSize: round6(1 - factor), collaterals: [...new Set(ms.map((m) => m.collateralSymbol))], exposure: exposure.toString(),
      exposureShare: round6(Number((exposure * 1_000_000n) / (totalAssets || 1n)) / 1_000_000), shocks };
  });

  // plain-language answer for a newcomer: one word from the executed runs, with the limits stated on screen
  const value = BigInt(r.target.holderValue);
  const shareOf = (x: any) => (value === 0n ? 0 : Number((BigInt(x.holderExecutedExit) * 10000n) / value) / 10000);
  const worstRun = r.runs.reduce((a: any, b: any) => (BigInt(b.holderExecutedExit) < BigInt(a.holderExecutedExit) ? b : a));
  const worstShare = shareOf(worstRun), aloneShare = shareOf(alone);
  const answer = {
    word: answerWord(!!alone.fullExitOk, worstShare),
    aloneFull: !!alone.fullExitOk, aloneShare, worstShare,
    worstRun: { id: worstRun.id, otherPool: worstRun.others.some((o: any) => o.vault.toLowerCase() !== vault.toLowerCase()), others: worstRun.others.length },
    level: answerLevel(!!alone.fullExitOk, worstShare),
    rule: `Easy exit: at least ${ANSWER_LIMITS.safe * 100} % of the largest deposit gets out even in the worst executed case; Tight exit: ${ANSWER_LIMITS.careful * 100}–${ANSWER_LIMITS.safe * 100} %; Hard exit: below ${ANSWER_LIMITS.careful * 100} %, or not everything can get out even alone. It describes how easily you can leave, not whether you should. These limits are a choice.`,
  };

  return {
    schema: "exitproof-refine/1", vault, name: r.target.name, assetSymbol: loanSym, source: r.source, answer,
    note: "Derived from results already executed or read (report, graph, history); no scenario re-executed, no existing number changed.",
    history, governance, exitWindow, vaultLevel, concentration, utilization,
    regimes: { definition: "pegged: collateral of the same family as the loan asset (ETH, USD, BTC, EUR by symbol), −10 %; volatile: otherwise, −40 %", factors: REGIMES, byRegime: regimes },
  };
}
