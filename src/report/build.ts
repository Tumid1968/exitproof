/**
 * End-to-end pipeline for one vault + holder:
 *   dependency graph (results/discovery) -> scenarios executed on the fork -> cushion bisection
 *   -> analytic shock sweep -> incidents -> stay/exit verdict + sensitivity
 * Writes results/reports/<vault>.json (UI) and results/manifests/<vault>.json (wei-exact replay).
 * Steakhouse ETH uses the curated catalog (reference values); any other V1 vault the generic one.
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { formatUnits, getAddress, type Address } from "viem";
import { loadGraph } from "../discovery/load.ts";
import { ForkEngine } from "../engine/fork.ts";
import { ScenarioRunner, type ScenarioResult, type Measurement, type Scenario } from "../engine/scenario.ts";
import { findCushion } from "../engine/cushion.ts";
import { steakhouseEthCatalog } from "../scenarios/catalog.ts";
import { genericCatalog, type CatalogMeta } from "../scenarios/generic.ts";
import { propagate, type Shock } from "../shocks/analytic.ts";
import { decide, scaleTo18, type VerdictInputs } from "../verdict/verdict.ts";
import { ACTORS, SOURCE, TIMESTAMP_STEP } from "../lib/constants.ts";
import { pctChange, toJson } from "../lib/util.ts";
import { referenceRates } from "./references.ts";

const B = (s: string | bigint) => BigInt(s);
type LiqResult = Extract<ScenarioResult["results"][number], { type: "liquidateAll" }>;
const measures = (r: ScenarioResult) => r.results.filter((a) => a.type === "measure").map((a) => (a as { m: Measurement }).m);
const measure = (r: ScenarioResult, label: string) => measures(r).find((m) => m.label === label)!;
const exits = (r: ScenarioResult) => r.results.filter((a) => a.type === "exit").map((a) => (a as Extract<typeof a, { type: "exit" }>).result);
const liqs = (r: ScenarioResult) => r.results.filter((x) => x.type === "liquidateAll") as LiqResult[];
const sub = (a: bigint, b: bigint) => (a > b ? a - b : 0n);

export const reportPath = (vault: Address) => `results/reports/${getAddress(vault)}.json`;
export const manifestPath = (vault: Address) => `results/manifests/${getAddress(vault)}.json`;

export async function buildReport(vaultIn: Address = ACTORS.steakhouseEth, holderIn?: Address, log: (s: string) => void = console.log) {
  const vault = getAddress(vaultIn);
  const g = loadGraph(vault);
  const dec = g.target.assetDecimals;
  const curated = vault === getAddress(ACTORS.steakhouseEth) && (!holderIn || getAddress(holderIn) === getAddress(ACTORS.A));
  const { scenarios: catalog, meta } = curated ? steakhouseEthCatalog(g) : genericCatalog(g, holderIn);
  const holder = meta.target.holder;
  const eng = new ForkEngine();
  const fork = await eng.init();
  const runner = new ScenarioRunner(eng);

  // ---- 1. executed scenarios
  const results: ScenarioResult[] = [];
  for (const s of catalog) {
    const t0 = Date.now();
    results.push(await runner.run(s));
    log(`  ran ${s.id} (${Date.now() - t0} ms)`);
  }
  const byId = (id: string) => results.find((r) => r.id === id)!;
  const alone = byId(meta.runIds[0]);
  const src = measure(alone, "source state");
  const holderShares = B(src.holderShares);
  const totalSupply = B(src.vaultTotalSupply);
  const holderValue = B(src.holderValue);
  const aloneExit = exits(alone)[0];
  // If the full redeem reverts, what the holder can take out is the withdrawMax step that follows it
  const aloneSteps = exits(alone).filter((e) => e.owner === holder && e.vault === vault);
  const aloneOut = aloneExit.ok ? B(aloneExit.assetsOutWei) : B(aloneSteps[1]?.assetsOutWei ?? "0");
  /** value as Morpho sees it, net of V1.1 lostAssets */
  const econ = (m: Measurement) => B(m.holderEconomicValue ?? m.holderValue);
  const vaultEcon = (m: Measurement) => B(m.vaultTotalAssets) - B(m.vaultLostAssets ?? "0");

  // ---- 2. cushion before blockage, against the largest competing holder of the same vault
  let cushion: Awaited<ReturnType<typeof findCushion>> | null = null;
  if (meta.cushionOther) {
    log("  cushion bisection on the fork...");
    const otherMax = await (async () => {
      await eng.reset();
      const m = await runner.measure("x", { vault, holder: meta.cushionOther! });
      return B(m.holderMaxWithdraw);
    })();
    const precision = 10n ** BigInt(Math.max(0, dec - 3));
    try { cushion = await findCushion(runner, vault, holder, meta.cushionOther, otherMax, precision); } catch (e) { log(`  cushion skipped: ${(e as Error).message}`); }
    await eng.reset();
  }

  // ---- 3. exit-run table
  const aloneMax = aloneOut;
  const runs = meta.runIds.map((id) => {
    const r = byId(id);
    const ex = exits(r);
    const holderSteps = ex.filter((e) => e.owner === holder && e.vault === vault);
    const full = holderSteps[0];
    const exitable = full.ok ? B(full.assetsOutWei) : B(holderSteps[1]?.assetsOutWei ?? "0");
    return {
      id, title: r.title,
      others: ex.filter((e) => !(e.owner === holder && e.vault === vault)).map((e) => ({ label: e.label, vault: e.vault, owner: e.owner, out: e.assetsOutWei, ok: e.ok })),
      holderMaxWithdrawBefore: full.ownerMaxWithdrawBeforeWei, fullExitOk: full.ok, fullExitError: full.error,
      holderExecutedExit: exitable.toString(),
      lockedWei: (full.ok ? 0n : sub(holderValue, exitable)).toString(),
      changeVsAloneWei: (exitable - aloneMax).toString(),
      changePct: pctChange(exitable, aloneMax),
    };
  });

  // ---- 4. analytic shock sweep: every discovered feed, blind depeg of each exposed collateral, oracle overpricing
  const factors = [0.99, 0.97, 0.95, 0.9, 0.8];
  const feeds = g.nodes.filter((n) => n.kind === "feed");
  const exposed = g.markets.filter((m) => m.vaultSupplyAssets > 0n);
  const shockList: Shock[] = [];
  for (const f of feeds) for (const x of factors) shockList.push({ kind: "feed", feed: f.address!, factor: x, label: `${f.data.description} feed x${x}` });
  for (const c of [...new Set(exposed.filter((m) => m.collateralSymbol !== "none").map((m) => m.params.collateralToken))]) {
    const sym = g.markets.find((m) => m.params.collateralToken === c)!.collateralSymbol;
    for (const x of factors) shockList.push({ kind: "blindDepeg", collateral: c, factor: x, label: `${sym} market depeg x${x} (oracle unchanged)` });
  }
  for (const o of [...new Set(exposed.filter((m) => m.params.oracle !== "0x0000000000000000000000000000000000000000").map((m) => m.params.oracle))])
    for (const x of [1.02, 1.05, 1.1]) shockList.push({ kind: "oracleOverprice", oracle: o, factor: x, label: `oracle ${o.slice(0, 8)}… overprices x${x}` });
  const holderPart = (x: bigint) => (totalSupply === 0n ? 0n : (x * holderShares) / totalSupply);
  const sweep = shockList.map((s) => ({ s, r: propagate(g, s) })).filter(({ r }) => r.markets.some((m) => exposed.some((e) => e.id === m.id))).map(({ s, r }) => ({
    label: s.label, kind: s.kind, factor: s.factor, node: s.kind === "feed" ? s.feed : s.kind === "blindDepeg" ? s.collateral : s.oracle,
    vaultLoss: r.vaultLoss.toString(), vaultLossPct: r.vaultLossPct, vaultHiddenLoss: r.vaultHiddenLoss.toString(),
    holderLoss: holderPart(r.vaultLoss).toString(), holderHiddenLoss: holderPart(r.vaultHiddenLoss).toString(),
    withdrawableBefore: r.vaultWithdrawableBefore.toString(), withdrawableAfter: r.vaultWithdrawableAfter.toString(),
    markets: r.markets.map((m) => ({ id: m.id, label: m.label, factorSeen: m.priceFactorSeenByOracle, path: m.path, liquidatable: m.liquidatable, badDebt: m.badDebt.toString(), hiddenShortfall: m.hiddenShortfall.toString(), repaid: m.repaidByLiquidations.toString() })),
    hypotheses: r.hypotheses,
    dexLimited: s.kind === "feed" && Object.keys(g.dex ?? {}).length ? (() => {
      const d = propagate(g, s, { dexLimited: true });
      return {
        vaultLoss: d.vaultLoss.toString(), vaultHiddenLoss: d.vaultHiddenLoss.toString(), withdrawableAfter: d.vaultWithdrawableAfter.toString(),
        holderLoss: holderPart(d.vaultLoss).toString(), holderHiddenLoss: holderPart(d.vaultHiddenLoss).toString(),
        liquidated: d.markets.reduce((t, m) => t + m.liquidatedBorrowers.length, 0), unliquidated: d.markets.reduce((t, m) => t + m.unliquidated, 0),
      };
    })() : null,
  }));

  // ---- 5. executed shocks vs analytic (cross-check)
  const crossCheck = meta.crossChecks.map(({ id, shock }) => {
    const r = byId(id);
    const a = propagate(g, shock);
    const before = measure(r, "source state"), after = measure(r, "after shock and liquidations");
    return {
      id, label: shock.label, factor: shock.factor,
      executedBadDebt: liqs(r).reduce((s, x) => s + B(x.badDebtRealised), 0n).toString(), analyticBadDebt: a.markets.reduce((s, m) => s + m.badDebt, 0n).toString(),
      executedLiquidations: liqs(r).reduce((s, x) => s + x.liquidated, 0), analyticLiquidatable: a.markets.reduce((s, m) => s + m.liquidatable, 0),
      executedVaultLoss: sub(vaultEcon(before), vaultEcon(after)).toString(), analyticVaultLoss: a.vaultLoss.toString(),
      executedHolderValueLoss: sub(econ(before), econ(after)).toString(),
      note: "Executed values include interest accrued during the liquidation sequence (tx k at T0+12k); analytic ignores it.",
    };
  });

  // ---- 6. incidents -> verdict inputs
  const baseFee = B(g.source.baseFeePerGas ?? "0");
  const gasOut = B(aloneExit.gasUsed ?? "0") * baseFee; // in ETH wei; converted below for non-ETH assets is not done (shown separately)
  const gasInAsset = dec === 18 && g.target.assetSymbol.toUpperCase().includes("ETH") ? gasOut : 0n;
  const netApy = Number(g.summary.grossSupplyApyBeforeVaultFee ?? 0) * (1 - Number(g.summary.vaultPerformanceFee ?? 0));
  const exitableNow = aloneOut;
  // Slippage only on what was actually redeemed: a full redeem's shortfall vs its value; withdraw(assets) pays exact assets.
  // Locked funds are NOT slippage (they stay exposed and are counted in the verdict's residual risk).
  const slippage = aloneExit.ok ? sub(holderValue, B(aloneExit.assetsOutWei)) : 0n;
  const incidents: { id: string; regime: string; title: string; valueSource: string; executedFacts: Record<string, unknown>; inputs: { positionValue: bigint; exitableNow: bigint; incidentValueLoss: bigint; incidentLocked: bigint } }[] = [];
  if (meta.incidents.blind) {
    const ib = meta.incidents.blind;
    const r = byId(ib.id);
    const before = measure(r, "before the holder's exit");
    const a = propagate(g, { kind: "blindDepeg", collateral: ib.collateral, factor: ib.factor, label: "" });
    incidents.push({
      id: ib.id, regime: "oracle blind: no liquidation, losses unrecognised on-chain, liquidity drained by the run", title: r.title,
      valueSource: "analytic economic shortfall (debt minus collateral market value of underwater borrowers), pro rata of vault supply shares",
      executedFacts: { liquidatableFoundOnFork: liqs(r).reduce((s, x) => s + x.attempted, 0), holderMaxWithdrawAfterRun: before.holderMaxWithdraw },
      inputs: { positionValue: holderValue, exitableNow, incidentValueLoss: holderPart(a.vaultHiddenLoss), incidentLocked: sub(holderValue, B(before.holderMaxWithdraw)) },
    });
  }
  if (meta.incidents.shock) {
    const r = byId(meta.incidents.shock.id);
    const before = measure(r, "before the holder's exit");
    incidents.push({
      id: meta.incidents.shock.id, regime: "oracle sees it: liquidations realise bad debt and bring repaid liquidity back", title: r.title,
      valueSource: "executed on fork: holder value before minus after liquidations (bad debt socialised by Morpho Blue; net of lostAssets on MetaMorpho V1.1, where the share price does not drop)",
      executedFacts: { holderMaxWithdrawAfterRun: before.holderMaxWithdraw },
      inputs: { positionValue: holderValue, exitableNow, incidentValueLoss: sub(holderValue, econ(measure(r, "after shock and liquidations"))), incidentLocked: sub(B(before.holderValue), B(before.holderMaxWithdraw)) },
    });
  }
  if (meta.incidents.dexShock) {
    const r = byId(meta.incidents.dexShock.id);
    const before = measure(r, "before the holder's exit");
    const a = propagate(g, meta.incidents.dexShock.shock, { dexLimited: true });
    const recognised = sub(holderValue, econ(measure(r, "after shock and liquidations")));
    incidents.push({
      id: meta.incidents.dexShock.id, regime: "oracle sees it, but liquidations stop where the AMM depth measured at the block runs out: part of the loss stays unrecognised and less liquidity comes back", title: r.title,
      valueSource: "executed on fork (bad debt of the liquidations the AMM depth allows) + analytic unrecognised shortfall of the positions left insolvent",
      executedFacts: { holderMaxWithdrawAfterRun: before.holderMaxWithdraw, liquidatedOnFork: liqs(r).reduce((s, x) => s + x.liquidated, 0), leftInsolvent: a.markets.reduce((s, m) => s + m.unliquidated, 0) },
      inputs: { positionValue: holderValue, exitableNow, incidentValueLoss: recognised + holderPart(a.vaultHiddenLoss), incidentLocked: sub(B(before.holderValue), B(before.holderMaxWithdraw)) },
    });
  }
  const defaults = { probability: 0.05, horizonDays: 30, lockedHaircut: 0.1 };
  const mkInputs = (x: (typeof incidents)[number]["inputs"], d = defaults): VerdictInputs => ({ ...x, ...d, netApy, gasCostOut: gasInAsset, gasCostReentry: gasInAsset, slippage });
  const unit = g.target.assetSymbol;
  const verdicts = incidents.map((x) => ({ id: x.id, verdict: decide(scaleTo18(mkInputs(x.inputs), dec), unit) }));
  const blindMeta = meta.incidents.blind;
  const depegCurve = blindMeta && incidents[0] ? [0.99, 0.98, 0.97, 0.95, 0.9, 0.85, 0.8].map((f) => {
    const r = propagate(g, { kind: "blindDepeg", collateral: blindMeta.collateral, factor: f, label: "" });
    const v = decide(scaleTo18(mkInputs({ ...incidents[0].inputs, incidentValueLoss: holderPart(r.vaultHiddenLoss) }), dec), unit);
    return { factor: f, holderLoss: holderPart(r.vaultHiddenLoss).toString(), breakEven: v.breakEvenProbability };
  }) : [];
  const blindSym = blindMeta ? g.markets.find((m) => m.params.collateralToken === blindMeta.collateral)?.collateralSymbol : null;

  // ---- mitigation: Public Allocator executed before the holder's exit
  const mitigation = meta.mitigation ? (() => {
    const base = byId(meta.mitigation!.baseId), withPa = byId(meta.mitigation!.id);
    const holderOut = (r: ScenarioResult) => { const st = exits(r).filter((e) => e.owner === holder && e.vault === vault); return st[0].ok ? B(st[0].assetsOutWei) : B(st[1]?.assetsOutWei ?? "0"); };
    const pa = withPa.results.filter((x) => x.type === "publicReallocate") as Extract<ScenarioResult["results"][number], { type: "publicReallocate" }>[];
    return {
      id: meta.mitigation!.id, baseId: meta.mitigation!.baseId,
      withoutWei: holderOut(base).toString(), withWei: holderOut(withPa).toString(),
      fullExitWithPa: exits(withPa).filter((e) => e.owner === holder && e.vault === vault)[0].ok,
      reallocations: pa.map((x) => ({ vault: x.vault, moved: x.moved, ok: x.ok, error: x.error?.name ?? null, withdrawals: x.withdrawals.length, feeWei: x.feeWei })),
    };
  })() : null;

  // ---- 8. headline: what I really get back, dominant dependency, one-sentence verdict
  const references = await referenceRates(unit);
  const single = runs.filter((x) => x.others.length === 1);
  const worstOf = (xs: typeof runs) => [...xs].sort((a, b) => a.changePct - b.changePct)[0] ?? null;
  const pick = (x: (typeof runs)[number] | null) => x && {
    id: x.id, who: x.others[0].label, otherVault: x.others[0].vault, outWei: x.holderExecutedExit,
    fullExitOk: x.fullExitOk, error: x.fullExitError?.name ?? null, changePct: x.changePct,
  };
  const getBack = {
    alone: { outWei: runs[0].holderExecutedExit, fullExitOk: runs[0].fullExitOk, error: runs[0].fullExitError?.name ?? null },
    afterHolder: pick(worstOf(single.filter((x) => x.others[0].vault === vault))),
    afterPeer: pick(worstOf(single.filter((x) => x.others[0].vault !== vault))),
  };
  const peerName = (a: string) => g.peers.find((x) => x.vault === a)?.name ?? a;
  const liqDep = (() => {
    const h = getBack.afterHolder, pe = getBack.afterPeer;
    if (pe && (!h || pe.changePct < h.changePct) && pe.changePct < 0)
      return `exit liquidity shared with ${peerName(pe.otherVault)} in the same Morpho markets (its largest depositor leaving first cuts this exit by ${(-pe.changePct).toFixed(2)} %)`;
    if (h && h.changePct < 0) return `holder concentration (${(h.who ?? "another holder").replace(" exits", "")} leaving first cuts this exit by ${(-h.changePct).toFixed(2)} %)`;
    return null;
  })();
  const valueDep = (() => {
    const blindI = incidents.find((i) => i.id.includes("blind"));
    const coll = meta.incidents.blind ? g.markets.find((m) => m.params.collateralToken === meta.incidents.blind!.collateral) : null;
    if (blindI && blindI.inputs.incidentValueLoss > 0n && coll) {
      const o = g.nodes.find((n) => n.id === `oracle:${getAddress(coll.params.oracle)}`);
      return `${coll.collateralSymbol} collateral priced by "${o?.label.replace("Oracle: ", "") ?? "its oracle"}": a market depeg is not seen by liquidations`;
    }
    const sh = meta.incidents.shock;
    return sh ? `the ${sh.shock.label.replace(/ x0\.9$/, "")} price feed` : null;
  })();
  const binding = verdicts
    .map((v, i) => ({ v: v.verdict, inc: incidents[i] }))
    .filter((x) => x.v.breakEvenProbability !== null)
    .sort((a, b) => a.v.breakEvenProbability! - b.v.breakEvenProbability!)[0] ?? null;
  const refMain = references.find((r) => r.apy !== 0 && Number.isFinite(r.apy)) ?? null;
  const impliedFor = (lossFrac: number, ref: { apy: number }, days: number) => {
    const spread = netApy - ref.apy;
    return spread <= 0 || lossFrac <= 0 ? null : Math.min(1, (spread * days) / 365 / lossFrac);
  };
  const pctS = (x: number) => `${(x * 100).toFixed(2)} %`;
  const HORIZONS = [7, 30, 90], HAIRCUTS = [0, 0.1, 0.5];
  const posUnits = Number(formatUnits(holderValue, dec));
  const verdictGrid = incidents.map((inc) => ({
    id: inc.id,
    cells: HORIZONS.flatMap((h) => HAIRCUTS.map((hc) => {
      const v = decide(scaleTo18(mkInputs(inc.inputs, { ...defaults, horizonDays: h, lockedHaircut: hc }), dec), unit);
      const lossFrac = posUnits > 0 ? v.incidentLoss / posUnits : 0;
      return {
        horizonDays: h, lockedHaircut: hc,
        decision: v.decision, breakEven: v.breakEvenProbability, sentence: v.sentence,
        incidentLoss: v.incidentLoss, valueLoss: v.parts.valueLoss, lockedPart: hc * v.parts.lockedAfterRun, lockedAfterRun: v.parts.lockedAfterRun,
        exitCost: v.exitCost, forgoneYield: v.parts.forgoneYield, gas: v.parts.gasOut + v.parts.gasReentry, slippage: v.parts.slippage,
        exitableShare: v.exitableShare, expectedLossStayAtDefault: v.expectedLossStay, expectedLossExitAtDefault: v.expectedLossExit,
        implied: references.filter((r) => r.apy !== 0).map((r) => {
          const val = Number.isFinite(r.apy) ? impliedFor(lossFrac, r, h) : null;
          const reason = !Number.isFinite(r.apy) ? "reference unavailable" : netApy - r.apy <= 0 ? `not evaluated: the vault yields ${pctS(netApy)}, less than the ${r.name} (${pctS(r.apy)}), so the spread prices no default risk` : lossFrac <= 0 ? "not evaluated: the incident causes no loss" : null;
          return { reference: r.name, referenceApy: r.apy, value: val, reason };
        }),
      };
    })),
  }));
  const cellOf = (id: string, h: number, hc: number) => verdictGrid.find((x) => x.id === id)?.cells.find((c) => c.horizonDays === h && c.lockedHaircut === hc);
  const headline = (() => {
    const deps = [liqDep, valueDep].filter(Boolean).join("; ");
    if (!binding) {
      const none = verdicts.find((v) => v.verdict.decision === "NO_ACTION_POSSIBLE");
      return none ? `CANNOT EXIT: ${none.verdict.sentence}${deps ? ` Dominant dependency: ${deps}.` : ""}`
        : `STAY: no modelled incident causes a loss large enough to justify paying the exit cost.${deps ? ` Dominant dependency: ${deps}.` : ""}`;
    }
    const lf = binding.v.incidentLoss / Number(formatUnits(holderValue, dec));
    const impl = refMain ? impliedFor(lf, refMain, defaults.horizonDays) : null;
    const implTxt = !refMain ? "no sourced reference yield exists for this asset, so no spread-implied probability is given"
      : impl === null
      ? `the yield spread over the ${refMain.name}, ${pctS(netApy)} vs ${pctS(refMain.apy)}, is ${netApy - refMain.apy <= 0 ? "negative: it prices no default risk" : "not defined"}`
      : `the yield spread over the ${refMain.name}, ${pctS(netApy)} vs ${pctS(refMain.apy)}, implies ~${pctS(impl)} (risk-neutral, includes liquidity premium, not a prediction)`;
    const zero = cellOf(binding.inc.id, defaults.horizonDays, 0)?.breakEven ?? null;
    const zeroTxt = zero === null ? "" : ` (${zero > 1 ? "never, even if certain," : pctS(zero)} if locked funds cost 0 %)`;
    return `Exiting becomes worthwhile if you judge the incident "${binding.inc.title.replace(/^Incident: /, "")}" more likely than ${pctS(binding.v.breakEvenProbability!)} within ${defaults.horizonDays} days${zeroTxt}. ${implTxt[0].toUpperCase() + implTxt.slice(1)}.${deps ? ` Dominant dependency: ${deps}.` : ""}`;
  })();

  // ---- 7. evidence ledger: every headline number with its class, source and hypotheses
  type Ev = { item: string; value: string; cls: "measured" | "executed" | "bounded" | "modeled" | "hypothesis"; source: string; hypotheses: string };
  const fmtA = (x: bigint) => `${Number(formatUnits(x, dec)).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${unit}`;
  const worstRun = [...runs].sort((a, b) => (B(a.holderExecutedExit) < B(b.holderExecutedExit) ? -1 : 1))[0];
  const evidence: Ev[] = [
    { item: "Vault total assets", value: fmtA(B(src.vaultTotalAssets)), cls: "measured", source: `totalAssets() on ${vault} at block ${SOURCE.block}`, hypotheses: "none" },
    { item: "Withdrawable now (vault)", value: fmtA(B(String(g.summary.withdrawableNow))), cls: "measured", source: "Σ over the withdraw queue of min(vault supply, market idle liquidity): MetaMorpho withdrawQueue(i), Morpho Blue market(id) and position(id, vault)", hypotheses: "stored market totals (interest accrued up to the market's lastUpdate)" },
    { item: "Holder position", value: fmtA(holderValue), cls: "measured", source: "convertToAssets(balanceOf(holder))", hypotheses: "holder selection: largest holder from Morpho API candidates, balance re-read on-chain" },
    { item: "Holder exit alone", value: fmtA(aloneOut), cls: "executed", source: `scenario ${meta.runIds[0]}: redeem on the local fork, tx 1 at T0+12 s`, hypotheses: "holder impersonated on the fork" },
    { item: "Worst executed run (holder exitable)", value: `${fmtA(B(worstRun.holderExecutedExit))} (${worstRun.changePct.toFixed(2)} %)`, cls: "executed", source: `scenario ${worstRun.id}: ${worstRun.others.length} exits then the holder's`, hypotheses: "other holders impersonated: their exits are a scenario, not their intention" },
    ...(cushion ? [{ item: "Cushion before blockage", value: cushion.revertsAt === "none" ? "no blockage even at the competitor's full exit" : `passes ${fmtA(B(cushion.passesAt))}, reverts ${fmtA(B(cushion.revertsAt))}`, cls: "executed" as const, source: `bisection, ${cushion.probes.length} executions on the fork`, hypotheses: "competitor = next largest holder of the vault" }] : []),
    { item: "Borrowers identified", value: Object.values(g.borrowers).map((b) => `${(b.coverage * 100).toFixed(2)} %`).join(" / ") + " of debt", cls: "measured", source: "candidates from Morpho API, each position(id, borrower) re-read on-chain; coverage = Σ borrowShares found / totalBorrowShares", hypotheses: "none (coverage is measured, not assumed)" },
    { item: "Public Allocator backstop (net)", value: fmtA(B(String(g.summary.publicAllocatorReallocatableIntoExposedMarkets ?? "0"))), cls: "bounded", source: "flowCaps(vault, id), config(id), market(id), position(id, vault) of every peer vault with the Public Allocator", hypotheses: `upper bound: peers drawing on the same source market share its liquidity${mitigation ? `; executed in scenario ${mitigation.id}: holder exitable ${fmtA(B(mitigation.withoutWei))} → ${fmtA(B(mitigation.withWei))}` : ""}` },
    ...Object.entries(g.dex ?? {}).map(([id, d]) => {
      const m = g.markets.find((x) => x.id === id)!;
      return { item: `AMM liquidation capacity, ${m.collateralSymbol} market #${m.queueIndex}`, value: `${Number(formatUnits(d.capacity, m.collateralDecimals)).toLocaleString("en-US", { maximumFractionDigits: 2 })} of ${Number(formatUnits(d.collateralAtRisk, m.collateralDecimals)).toLocaleString("en-US", { maximumFractionDigits: 2 })} ${m.collateralSymbol} posted`, cls: "bounded" as const, source: "Uniswap V3 QuoterV2 and Curve get_dy quotes at the block; venues from the Uniswap V3 factory and Curve MetaRegistry", hypotheses: "lower bound: aggregators and other DEXes excluded; depth assumed to scale with a shocked price" };
    }),
    ...crossCheck.map((c) => ({ item: `Vault loss, ${c.label}`, value: `${fmtA(B(c.executedVaultLoss))} executed vs ${fmtA(B(c.analyticVaultLoss))} analytic`, cls: "executed" as const, source: `scenario ${c.id}: oracle replaced on the fork, ${c.executedLiquidations} liquidate() transactions, bad debt from Morpho Blue's Liquidate events`, hypotheses: "every unhealthy borrower is liquidated by a liquidator with enough loan tokens" })),
    ...incidents.filter((i) => i.id.includes("blind")).map((i) => ({ item: "Economic shortfall, oracle-blind depeg -10 % (holder share)", value: fmtA(i.inputs.incidentValueLoss), cls: "modeled" as const, source: "Σ max(0, debt − collateral × market price) over the identified borrowers, pro rata of supply shares", hypotheses: "depeg persists, underwater borrowers walk away; lower bound for holders who stay (first exiters leave at full value)" })),
    ...g.nodes.filter((n) => n.kind === "feed" && n.data.observedUpdates).map((n) => {
      const u = n.data.observedUpdates as { roundsObserved: number; maxGapSeconds: number; minTriggeredMovePct: number | null; medianMovePct: number; ageWithinObservedMax: boolean };
      const age = ((n.data.ageSeconds as number) / 3600).toFixed(1);
      const tm = u.minTriggeredMovePct ?? u.medianMovePct;
      const trig = tm < 0.05 ? "heartbeat-driven (moves < 0.05 %)" : `trigger move ~${tm.toFixed(2)} %`;
      return {
        item: `Feed freshness, ${n.data.description}`,
        value: `age ${age} h; max observed interval ${(u.maxGapSeconds / 3600).toFixed(1)} h; ${trig} → ${u.ageWithinObservedMax ? "normal" : "OLDER than any observed interval"}`,
        cls: "measured" as const,
        source: `latestRoundData + getRoundData of the last ${u.roundsObserved} rounds on ${n.address}`,
        hypotheses: "heartbeat and deviation threshold are not on-chain: inferred from observed updates",
      };
    }),
    { item: "Net APY (yield given up by exiting)", value: `${(netApy * 100).toFixed(2)} %`, cls: "measured", source: "IRM borrowRateView(params, market) per market × utilization × (1 − market fee), weighted by the vault's supply, minus the vault performance fee", hypotheses: "rate constant over the horizon (APR compounded continuously)" },
    { item: "Gas of the exit", value: `${aloneExit.gasUsed} gas × ${(Number(baseFee) / 1e9).toFixed(3)} gwei`, cls: "executed", source: "gasUsed of the exit on the fork × baseFeePerGas of the source block header", hypotheses: "re-entry assumed to cost the same gas (no deposit executed)" },
    { item: "Break-even incident probability", value: verdicts.map((v) => (v.verdict.breakEvenProbability === null ? "—" : v.verdict.breakEvenProbability > 1 ? ">100 %" : `${(v.verdict.breakEvenProbability * 100).toFixed(2)} %`)).join(" / "), cls: "modeled", source: "p* = exit cost / (incident loss × exitable share); src/verdict/verdict.ts", hypotheses: `horizon ${defaults.horizonDays} d, locked funds cost ${defaults.lockedHaircut * 100} %, net APY ${(netApy * 100).toFixed(2)} %` },
    { item: "Incident probability", value: `${defaults.probability * 100} % (default)`, cls: "hypothesis", source: "user input", hypotheses: "never a prediction" },
    ...references.filter((r) => r.apy !== 0).map((r) => ({ item: `Reference yield: ${r.name}`, value: Number.isFinite(r.apy) ? `${(r.apy * 100).toFixed(2)} %` : "unavailable", cls: "measured" as const, source: r.source, hypotheses: r.note })),
    { item: "Spread-implied incident probability", value: "see section 5 (depends on horizon and loss fraction)", cls: "modeled", source: "PD ≈ (vault net APY − reference yield) × horizon / loss fraction (classic credit approximation)", hypotheses: "risk-neutral, includes liquidity and smart-contract premia; not a prediction; undefined when the spread is ≤ 0" },
  ];

  const report = {
    schema: "exitproof.report/0.2",
    generatedBy: "src/report/build.ts",
    catalog: curated ? "curated (Steakhouse ETH reference scenarios)" : "generic (derived from the discovered graph)",
    source: { ...g.source, forkLocalChainId: fork.localChainId },
    target: { ...g.target, holder, holderLabel: holder === g.holders.list[0]?.address ? "largest holder" : "selected holder", holderShares: holderShares.toString(), holderValue: holderValue.toString(), holderMaxWithdraw: src.holderMaxWithdraw },
    vault: { totalAssets: src.vaultTotalAssets, totalSupply: src.vaultTotalSupply, ...g.summary, netApy, holders: g.holders },
    queue: g.markets.map((m) => ({ index: m.queueIndex, id: m.id, collateral: m.collateralSymbol, collateralDecimals: m.collateralDecimals, lltv: m.params.lltv.toString(), vaultSupply: m.vaultSupplyAssets.toString(), liquidity: m.liquidity.toString(), withdrawable: m.vaultWithdrawable.toString(), utilization: m.utilization, oracle: m.params.oracle, supplyApr: m.supplyApr })),
    runs, cushion: cushion ? { ...cushion, probes: cushion.probes.length } : null,
    sweep, crossCheck,
    incidents: incidents.map((x) => ({ ...x, inputs: Object.fromEntries(Object.entries(x.inputs).map(([k, v]) => [k, v.toString()])) })),
    verdictParams: { netApy, decimals: dec, gasCostOut: gasInAsset.toString(), gasCostReentry: gasInAsset.toString(), gasNote: gasInAsset === 0n ? "gas is paid in ETH: not converted into the vault asset (no sourced price), shown separately" : null, gasOutEth: gasOut.toString(), slippage: slippage.toString(), exitGasUsed: aloneExit.gasUsed, baseFeePerGas: baseFee.toString(), defaults },
    verdicts, depegCurve, depegCurveCollateral: blindSym, evidence, mitigation,
    headline, getBack, dominantDependency: { liquidity: liqDep, value: valueDep }, references, verdictGrid,
    bindingIncident: binding ? binding.inc.id : null,
    headlineDecision: binding ? binding.v.decision : verdicts.some((v) => v.verdict.decision === "NO_ACTION_POSSIBLE") ? "NO_ACTION_POSSIBLE" : "STAY",
    dex: Object.fromEntries(Object.entries(g.dex ?? {}).map(([id, d]) => [id, { capacity: d.capacity.toString(), collateralAtRisk: d.collateralAtRisk.toString(), venues: d.venues.filter((v) => v.capacity > 0n).map((v) => ({ ...v, capacity: v.capacity.toString() })) }])),
  };
  mkdirSync("results/reports", { recursive: true });
  writeFileSync(reportPath(vault), toJson(report));
  writeManifest(vault, catalog, results, cushion);
  log(`report ${g.target.name}: holder ${formatUnits(holderValue, dec)} ${unit}, cushion ${cushion ? formatUnits(B(cushion.passesAt), dec) : "n/a"}, verdicts ${verdicts.map((v) => v.verdict.decision).join("/")}`);
  return report;
}

export function manifestHash(m: Record<string, unknown>) {
  const { sha256: _omit, ...rest } = m;
  return createHash("sha256").update(toJson(rest)).digest("hex");
}

function writeManifest(vault: Address, catalog: Scenario[], results: ScenarioResult[], cushion: Awaited<ReturnType<typeof findCushion>> | null) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const m: Record<string, unknown> = {
    exitproof_manifest: "0.2",
    created_at: new Date().toISOString(),
    tooling: { node: process.version, hardhat: pkg.dependencies.hardhat, viem: pkg.dependencies.viem },
    source: { chainId: SOURCE.chainId, block: SOURCE.block.toString(), blockHash: SOURCE.blockHash, timestamp: SOURCE.timestamp.toString(), rpc: "archive RPC via local proxy 127.0.0.1:8600 (upstream URL not recorded)" },
    vault,
    convention: `transaction k (1-based) of a scenario is mined at timestamp ${SOURCE.timestamp} + ${TIMESTAMP_STEP}*k; every scenario starts from the same snapshot of the source block`,
    assumptions: [
      "Local fork: no transaction is sent to Ethereum",
      "Impersonated actors: scenario hypothesis, not their signature or intention",
      "Oracle overrides (hardhat_setCode with a constant price) and liquidator funding (hardhat_setStorageAt / wrapped ETH) are shock hypotheses",
    ],
    scenarios: catalog.map((s) => ({ scenario: s, expected: results.find((r) => r.id === s.id) })),
    cushion,
  };
  m.sha256 = manifestHash(m);
  mkdirSync("results/manifests", { recursive: true });
  writeFileSync(manifestPath(vault), toJson(m));
}
