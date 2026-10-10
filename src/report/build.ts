/**
 * End-to-end pipeline for one vault + holder:
 *   discovery graph (results/discovery) -> scenarios executed on the fork -> cushion bisection
 *   -> analytic shock sweep -> incidents -> stay/exit verdict + sensitivity
 * Writes results/report.json (for the UI) and results/manifest.json (for wei-exact replay).
 */
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { formatEther, type Address } from "viem";
import { loadGraph } from "../discovery/load.ts";
import { ForkEngine } from "../engine/fork.ts";
import { ScenarioRunner, type ScenarioResult, type Measurement, type Scenario } from "../engine/scenario.ts";
import { findCushion } from "../engine/cushion.ts";
import { steakhouseEthCatalog } from "../scenarios/catalog.ts";
import { propagate, type Shock } from "../shocks/analytic.ts";
import { decide, type VerdictInputs } from "../verdict/verdict.ts";
import { ACTORS, ADDR, SOURCE, TIMESTAMP_STEP } from "../lib/constants.ts";
import { toJson } from "../lib/util.ts";

const B = (s: string | bigint) => BigInt(s);
const measures = (r: ScenarioResult) => r.results.filter((a) => a.type === "measure").map((a) => (a as { m: Measurement }).m);
const measure = (r: ScenarioResult, label: string) => measures(r).find((m) => m.label === label)!;
const exits = (r: ScenarioResult) => r.results.filter((a) => a.type === "exit").map((a) => (a as Extract<typeof a, { type: "exit" }>).result);

export async function buildReport(log: (s: string) => void = console.log) {
  const vault = ACTORS.steakhouseEth;
  const holder = ACTORS.A;
  const g = loadGraph(vault);
  const eng = new ForkEngine();
  const fork = await eng.init();
  const runner = new ScenarioRunner(eng);
  const catalog = steakhouseEthCatalog(g);

  // ---- 1. executed scenarios
  const results: ScenarioResult[] = [];
  for (const s of catalog) {
    const t0 = Date.now();
    results.push(await runner.run(s));
    log(`  ran ${s.id} (${Date.now() - t0} ms)`);
  }
  const byId = (id: string) => results.find((r) => r.id === id)!;
  const alone = byId("A_alone");
  const src = measure(alone, "source state");
  const holderShares = B(src.holderShares);
  const totalSupply = B(src.vaultTotalSupply);
  const holderValue = B(src.holderValue);
  const aloneExit = exits(alone)[0];

  // ---- 2. cushion before blockage (other = holder #2)
  log("  cushion bisection on the fork...");
  const bMax = B(measure(byId("B_first"), "source state").vaultTotalAssets) > 0n ? B(exits(byId("B_first"))[0].ownerMaxWithdrawBeforeWei) : 0n;
  const cushion = await findCushion(runner, vault, holder, ACTORS.B, bMax);
  await eng.reset();

  // ---- 3. exit-run table
  const runIds = ["A_alone", "C_first", "D_first", "C_D_first", "B_first", "B_C_first", "VB1_other_vault", "B_both_vaults"];
  const runs = runIds.map((id) => {
    const r = byId(id);
    const ex = exits(r);
    const holderSteps = ex.filter((e) => e.owner === holder);
    const full = holderSteps[0];
    const before = B(full.ownerMaxWithdrawBeforeWei);
    const others = ex.filter((e) => e.owner !== holder).map((e) => ({ label: e.label, vault: e.vault, owner: e.owner, out: e.assetsOutWei, ok: e.ok }));
    const aloneMax = B(aloneExit.assetsOutWei);
    const exitable = full.ok ? B(full.assetsOutWei) : B(holderSteps[1]?.assetsOutWei ?? "0");
    return {
      id, title: r.title, others, holderMaxWithdrawBefore: before.toString(), fullExitOk: full.ok, fullExitError: full.error,
      holderExecutedExit: exitable.toString(),
      lockedWei: (full.ok ? 0n : holderValue - exitable > 0n ? holderValue - exitable : 0n).toString(),
      changeVsAloneWei: (exitable - aloneMax).toString(),
      changePct: Number(((exitable - aloneMax) * 10_000n) / aloneMax) / 100,
    };
  });

  // ---- 4. analytic shock sweep (all discovered feeds + blind depeg of each collateral)
  const sweep: unknown[] = [];
  const factors = [0.99, 0.97, 0.95, 0.9, 0.8];
  const feeds = g.nodes.filter((n) => n.kind === "feed");
  const shockList: Shock[] = [];
  for (const f of feeds) for (const x of factors) shockList.push({ kind: "feed", feed: f.address!, factor: x, label: `${f.data.description} feed x${x}` });
  const collaterals = [...new Set(g.markets.filter((m) => m.vaultSupplyAssets > 0n && m.collateralSymbol !== "none").map((m) => m.params.collateralToken))];
  for (const c of collaterals) for (const x of factors) {
    const sym = g.markets.find((m) => m.params.collateralToken === c)!.collateralSymbol;
    shockList.push({ kind: "blindDepeg", collateral: c, factor: x, label: `${sym} market depeg x${x} (oracle unchanged)` });
  }
  const oraclesExposed = [...new Set(g.markets.filter((m) => m.vaultSupplyAssets > 0n && m.params.oracle !== "0x0000000000000000000000000000000000000000").map((m) => m.params.oracle))];
  for (const o of oraclesExposed) for (const x of [1.02, 1.05, 1.1]) shockList.push({ kind: "oracleOverprice", oracle: o, factor: x, label: `oracle ${o.slice(0, 8)}… overprices x${x}` });
  for (const s of shockList) {
    const r = propagate(g, s);
    if (!r.markets.length) continue;
    sweep.push({
      label: s.label, kind: s.kind, factor: s.factor, node: s.kind === "feed" ? s.feed : s.kind === "blindDepeg" ? s.collateral : s.oracle,
      vaultLoss: r.vaultLoss.toString(), vaultLossPct: r.vaultLossPct, vaultHiddenLoss: r.vaultHiddenLoss.toString(),
      holderLoss: ((r.vaultLoss * holderShares) / totalSupply).toString(),
      holderHiddenLoss: ((r.vaultHiddenLoss * holderShares) / totalSupply).toString(),
      withdrawableBefore: r.vaultWithdrawableBefore.toString(), withdrawableAfter: r.vaultWithdrawableAfter.toString(),
      markets: r.markets.map((m) => ({ id: m.id, label: m.label, factorSeen: m.priceFactorSeenByOracle, path: m.path, liquidatable: m.liquidatable, badDebt: m.badDebt.toString(), hiddenShortfall: m.hiddenShortfall.toString(), repaid: m.repaidByLiquidations.toString() })),
      hypotheses: r.hypotheses,
    });
  }

  // ---- 5. executed shocks vs analytic (cross-check)
  const rateFeed = feeds.find((f) => String(f.data.description).includes("wstETH/stETH"));
  const crossCheck = ["lido_loss_5pct", "lido_loss_10pct"].map((id) => {
    const r = byId(id);
    const factor = id.endsWith("5pct") ? 0.95 : 0.9;
    const a = propagate(g, { kind: "feed", feed: rateFeed!.address!, factor, label: "" });
    const liq = r.results.filter((x) => x.type === "liquidateAll") as Extract<ScenarioResult["results"][number], { type: "liquidateAll" }>[];
    const executedBad = liq.reduce((s, x) => s + B(x.badDebtRealised), 0n);
    const analyticBad = a.markets.reduce((s, m) => s + m.badDebt, 0n);
    const before = measure(r, "source state"), after = measure(r, "after shock and liquidations");
    return {
      id, factor, executedBadDebt: executedBad.toString(), analyticBadDebt: analyticBad.toString(),
      executedLiquidations: liq.reduce((s, x) => s + x.liquidated, 0), analyticLiquidatable: a.markets.reduce((s, m) => s + m.liquidatable, 0),
      executedVaultLoss: (B(before.vaultTotalAssets) - B(after.vaultTotalAssets)).toString(), analyticVaultLoss: a.vaultLoss.toString(),
      executedHolderValueLoss: (B(before.holderValue) - B(after.holderValue)).toString(),
      note: "Executed values include interest accrued during the liquidation sequence (tx k at T0+12k); analytic ignores it.",
    };
  });

  // ---- 6. incidents -> verdict inputs
  const baseFee = B(g.source.baseFeePerGas ?? "0");
  const gasOut = B(aloneExit.gasUsed ?? "0") * baseFee;
  const netApy = Number(g.summary.grossSupplyApyBeforeVaultFee ?? 0) * (1 - Number(g.summary.vaultPerformanceFee ?? 0));
  const exitableNow = B(aloneExit.assetsOutWei);
  const slippage = holderValue > exitableNow ? holderValue - exitableNow : 0n;
  const lido = byId("incident_lido10_plus_run");
  const lidoBefore = measure(lido, "before the holder's exit");
  const blind = byId("incident_steth_depeg_blind_plus_run");
  const blindBefore = measure(blind, "before the holder's exit");
  const blind10 = propagate(g, { kind: "blindDepeg", collateral: ADDR.wstETH, factor: 0.9, label: "" });
  const blindSweep = blind.results.filter((x) => x.type === "liquidateAll") as Extract<ScenarioResult["results"][number], { type: "liquidateAll" }>[];
  const incidents = [
    {
      id: "incident_steth_depeg_blind_plus_run", regime: "oracle blind: no liquidation, losses unrecognised, liquidity drained by the run",
      title: "stETH depegs -10% on the market (oracle unchanged) + holder #2 and Vault Bridge #1 exit first",
      valueSource: "analytic economic shortfall (debt minus collateral market value of underwater borrowers), pro rata of vault supply shares",
      executedFacts: { liquidatableFoundOnFork: blindSweep.reduce((s, x) => s + x.attempted, 0), holderMaxWithdrawAfterRun: blindBefore.holderMaxWithdraw },
      inputs: {
        positionValue: holderValue, exitableNow,
        incidentValueLoss: (blind10.vaultHiddenLoss * holderShares) / totalSupply,
        incidentLocked: holderValue > B(blindBefore.holderMaxWithdraw) ? holderValue - B(blindBefore.holderMaxWithdraw) : 0n,
      },
    },
    {
      id: "incident_lido10_plus_run", regime: "oracle sees it: liquidations realise bad debt and bring repaid liquidity back",
      title: "Lido backing loss -10% (oracle sees it), all unhealthy borrowers liquidated, then holder #2 and Vault Bridge #1 exit first",
      valueSource: "executed on fork: holder value before minus after liquidations (bad debt socialised by Morpho Blue)",
      executedFacts: { holderMaxWithdrawAfterRun: lidoBefore.holderMaxWithdraw },
      inputs: {
        positionValue: holderValue, exitableNow,
        incidentValueLoss: holderValue - B(measure(lido, "after shock and liquidations").holderValue),
        incidentLocked: B(lidoBefore.holderValue) > B(lidoBefore.holderMaxWithdraw) ? B(lidoBefore.holderValue) - B(lidoBefore.holderMaxWithdraw) : 0n,
      },
    },
  ];
  const defaults = { probability: 0.05, horizonDays: 30, lockedHaircut: 0.1 };
  const mkInputs = (x: (typeof incidents)[number]["inputs"], d = defaults): VerdictInputs => ({
    ...x, ...d, netApy, gasCostOut: gasOut, gasCostReentry: gasOut, slippage,
  });
  const verdicts = incidents.map((x) => ({ id: x.id, verdict: decide(mkInputs(x.inputs)) }));
  const sensitivity = incidents.map((x) => ({
    id: x.id,
    grid: [7, 30, 90].flatMap((h) => [0, 0.1, 0.5].map((hc) => ({ horizonDays: h, lockedHaircut: hc, breakEven: decide(mkInputs(x.inputs, { ...defaults, horizonDays: h, lockedHaircut: hc })).breakEvenProbability }))),
  }));
  // Break-even vs depeg size (blind regime, analytic value + executed run liquidity)
  const depegCurve = [0.99, 0.98, 0.97, 0.95, 0.9, 0.85, 0.8].map((f) => {
    const r = propagate(g, { kind: "blindDepeg", collateral: ADDR.wstETH, factor: f, label: "" });
    const v = decide(mkInputs({ ...incidents[0].inputs, incidentValueLoss: (r.vaultHiddenLoss * holderShares) / totalSupply }));
    return { factor: f, holderLoss: ((r.vaultHiddenLoss * holderShares) / totalSupply).toString(), breakEven: v.breakEvenProbability };
  });

  const report = {
    schema: "exitproof.report/0.1",
    generatedBy: "src/report/build.ts",
    labels: {
      onchain: "Real data read on-chain at the frozen block",
      fork: "Transaction simulated on a local fork (Hardhat 3), never sent to Ethereum",
      hypothesis: "Scenario hypothesis (impersonated actors, shocks, probabilities)",
    },
    source: { ...g.source, forkLocalChainId: fork.localChainId },
    target: { ...g.target, holder, holderLabel: "largest holder", holderShares: holderShares.toString(), holderValue: holderValue.toString(), holderMaxWithdraw: src.holderMaxWithdraw },
    vault: { totalAssets: src.vaultTotalAssets, totalSupply: src.vaultTotalSupply, ...g.summary, netApy },
    queue: g.markets.map((m) => ({ index: m.queueIndex, id: m.id, collateral: m.collateralSymbol, lltv: m.params.lltv.toString(), vaultSupply: m.vaultSupplyAssets.toString(), liquidity: m.liquidity.toString(), withdrawable: m.vaultWithdrawable.toString(), utilization: m.utilization, oracle: m.params.oracle, supplyApr: m.supplyApr })),
    runs, cushion: { ...cushion, probes: cushion.probes.length },
    sweep, crossCheck, incidents: incidents.map((x) => ({ ...x, inputs: Object.fromEntries(Object.entries(x.inputs).map(([k, v]) => [k, v.toString()])) })),
    verdictParams: { netApy, gasCostOut: gasOut.toString(), gasCostReentry: gasOut.toString(), slippage: slippage.toString(), exitGasUsed: aloneExit.gasUsed, baseFeePerGas: baseFee.toString(), defaults },
    verdicts, sensitivity, depegCurve,
  };
  mkdirSync("results", { recursive: true });
  writeFileSync("results/report.json", toJson(report));
  writeManifest(catalog, results, cushion);
  log(`report: holder ${formatEther(holderValue)} WETH, cushion ${formatEther(B(cushion.passesAt))}, verdict[0] ${verdicts[0].verdict.decision}`);
  return report;
}

export function manifestHash(m: Record<string, unknown>) {
  const { sha256: _omit, ...rest } = m;
  return createHash("sha256").update(toJson(rest)).digest("hex");
}

function writeManifest(catalog: Scenario[], results: ScenarioResult[], cushion: Awaited<ReturnType<typeof findCushion>>) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const m: Record<string, unknown> = {
    exitproof_manifest: "0.1",
    created_at: new Date().toISOString(),
    tooling: { node: process.version, hardhat: pkg.dependencies.hardhat, viem: pkg.dependencies.viem },
    source: { chainId: SOURCE.chainId, block: SOURCE.block.toString(), blockHash: SOURCE.blockHash, timestamp: SOURCE.timestamp.toString(), rpc: "archive RPC via local proxy 127.0.0.1:8600 (upstream URL not recorded)" },
    convention: `transaction k (1-based) of a scenario is mined at timestamp ${SOURCE.timestamp} + ${TIMESTAMP_STEP}*k; every scenario starts from the same snapshot of the source block`,
    assumptions: [
      "Local fork: no transaction is sent to Ethereum",
      "Impersonated actors: scenario hypothesis, not their signature or intention",
      "Oracle overrides (hardhat_setCode with a constant price) are shock hypotheses",
    ],
    scenarios: catalog.map((s) => ({ scenario: s, expected: results.find((r) => r.id === s.id) })),
    cushion: { ...cushion },
  };
  m.sha256 = manifestHash(m);
  writeFileSync("results/manifest.json", toJson(m));
}
