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
import { decide, type VerdictInputs } from "../verdict/verdict.ts";
import { ACTORS, SOURCE, TIMESTAMP_STEP } from "../lib/constants.ts";
import { toJson } from "../lib/util.ts";

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
  const aloneMax = B(aloneExit.assetsOutWei);
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
      changePct: aloneMax === 0n ? 0 : Number(((exitable - aloneMax) * 10_000n) / aloneMax) / 100,
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
      executedVaultLoss: sub(B(before.vaultTotalAssets), B(after.vaultTotalAssets)).toString(), analyticVaultLoss: a.vaultLoss.toString(),
      executedHolderValueLoss: sub(B(before.holderValue), B(after.holderValue)).toString(),
      note: "Executed values include interest accrued during the liquidation sequence (tx k at T0+12k); analytic ignores it.",
    };
  });

  // ---- 6. incidents -> verdict inputs
  const baseFee = B(g.source.baseFeePerGas ?? "0");
  const gasOut = B(aloneExit.gasUsed ?? "0") * baseFee; // in ETH wei; converted below for non-ETH assets is not done (shown separately)
  const gasInAsset = dec === 18 && g.target.assetSymbol.toUpperCase().includes("ETH") ? gasOut : 0n;
  const netApy = Number(g.summary.grossSupplyApyBeforeVaultFee ?? 0) * (1 - Number(g.summary.vaultPerformanceFee ?? 0));
  const exitableNow = B(aloneExit.assetsOutWei);
  const slippage = sub(holderValue, exitableNow);
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
      valueSource: "executed on fork: holder value before minus after liquidations (bad debt socialised by Morpho Blue)",
      executedFacts: { holderMaxWithdrawAfterRun: before.holderMaxWithdraw },
      inputs: { positionValue: holderValue, exitableNow, incidentValueLoss: sub(holderValue, B(measure(r, "after shock and liquidations").holderValue)), incidentLocked: sub(B(before.holderValue), B(before.holderMaxWithdraw)) },
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

  const report = {
    schema: "exitproof.report/0.2",
    generatedBy: "src/report/build.ts",
    catalog: curated ? "curated (Steakhouse ETH reference scenarios)" : "generic (derived from the discovered graph)",
    source: { ...g.source, forkLocalChainId: fork.localChainId },
    target: { ...g.target, holder, holderLabel: holder === g.holders.list[0]?.address ? "largest holder" : "selected holder", holderShares: holderShares.toString(), holderValue: holderValue.toString(), holderMaxWithdraw: src.holderMaxWithdraw },
    vault: { totalAssets: src.vaultTotalAssets, totalSupply: src.vaultTotalSupply, ...g.summary, netApy, holders: g.holders },
    queue: g.markets.map((m) => ({ index: m.queueIndex, id: m.id, collateral: m.collateralSymbol, lltv: m.params.lltv.toString(), vaultSupply: m.vaultSupplyAssets.toString(), liquidity: m.liquidity.toString(), withdrawable: m.vaultWithdrawable.toString(), utilization: m.utilization, oracle: m.params.oracle, supplyApr: m.supplyApr })),
    runs, cushion: cushion ? { ...cushion, probes: cushion.probes.length } : null,
    sweep, crossCheck,
    incidents: incidents.map((x) => ({ ...x, inputs: Object.fromEntries(Object.entries(x.inputs).map(([k, v]) => [k, v.toString()])) })),
    verdictParams: { netApy, decimals: dec, gasCostOut: gasInAsset.toString(), gasCostReentry: gasInAsset.toString(), gasNote: gasInAsset === 0n ? "gas is paid in ETH: not converted into the vault asset (no sourced price), shown separately" : null, gasOutEth: gasOut.toString(), slippage: slippage.toString(), exitGasUsed: aloneExit.gasUsed, baseFeePerGas: baseFee.toString(), defaults },
    verdicts, depegCurve, depegCurveCollateral: blindSym,
  };
  mkdirSync("results/reports", { recursive: true });
  writeFileSync(reportPath(vault), toJson(report));
  writeManifest(vault, catalog, results, cushion);
  log(`report ${g.target.name}: holder ${formatUnits(holderValue, dec)} ${unit}, cushion ${cushion ? formatUnits(B(cushion.passesAt), dec) : "n/a"}, verdicts ${verdicts.map((v) => v.verdict.decision).join("/")}`);
  return report;
}

/** The verdict works in 18-decimal units; rescale amounts of 6-decimal assets (USDC...). */
export function scaleTo18(i: VerdictInputs, decimals: number): VerdictInputs {
  if (decimals === 18) return i;
  const f = 10n ** BigInt(18 - decimals);
  return { ...i, positionValue: i.positionValue * f, exitableNow: i.exitableNow * f, incidentValueLoss: i.incidentValueLoss * f, incidentLocked: i.incidentLocked * f, slippage: i.slippage * f, gasCostOut: i.gasCostOut * f, gasCostReentry: i.gasCostReentry * f };
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
