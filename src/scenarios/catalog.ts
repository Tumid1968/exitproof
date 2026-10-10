/**
 * Scenario catalog built from a discovered graph. Exit runs use real holders at the source block;
 * shocks are derived from the graph (which oracle sees which feed) and executed on the fork.
 */
import { getAddress, type Address, type Hex } from "viem";
import type { DependencyGraph } from "../discovery/types.ts";
import type { Scenario, ScenarioAction } from "../engine/scenario.ts";
import { propagate, type Shock } from "../shocks/analytic.ts";
import { ACTORS, ADDR } from "../lib/constants.ts";
import type { CatalogMeta } from "./generic.ts";

export const RUN_HYPOTHESIS = "Other holders are impersonated on a local fork: their exits are a scenario hypothesis, not their signature or intention.";
export const FORK_FACT = "Contracts and state are real at the source block; transactions are simulated on a local fork, never sent to Ethereum.";

const exit = (vault: Address, owner: Address, label: string): ScenarioAction => ({ type: "exit", label, vault, owner, action: { kind: "redeemAll" } });

/** Turn a feed shock into executable oracle overrides + liquidations, using the analytic propagation path. */
export function shockActions(g: DependencyGraph, shock: Shock, opts: { dexLimited?: boolean } = {}): { actions: ScenarioAction[]; affected: Hex[] } {
  const r = propagate(g, shock, opts);
  const byOracle = new Map<Address, number>();
  for (const m of r.markets) {
    const mk = g.markets.find((x) => x.id === m.id)!;
    if (m.priceFactorSeenByOracle !== 1) byOracle.set(getAddress(mk.params.oracle), m.priceFactorSeenByOracle);
  }
  const actions: ScenarioAction[] = [];
  for (const [oracle, f] of byOracle)
    actions.push({ type: "oraclePrice", label: `oracle ${oracle.slice(0, 10)}… price x${f}`, oracle, num: String(Math.round(f * 1e6)), den: "1000000" });
  const affected = r.markets.filter((m) => m.priceFactorSeenByOracle !== 1).map((m) => m.id);
  for (const id of affected) {
    const mi = r.markets.find((m) => m.id === id)!;
    // DEX-limited: only the borrowers whose collateral the measured AMM depth can absorb are liquidated
    const list = opts.dexLimited ? mi.liquidatedBorrowers : (g.borrowers[id]?.list ?? []).map((b) => b.address);
    actions.push({ type: "liquidateAll", label: `liquidations in ${mi.label}${opts.dexLimited ? ` (${list.length} absorbable by AMM depth, ${mi.unliquidated} not)` : ""}`, marketId: id, borrowers: list });
  }
  return { actions, affected };
}

/** Curated catalog for Steakhouse ETH: reproduces the reference values of the preparation night. */
export function steakhouseEthCatalog(g: DependencyGraph): { scenarios: Scenario[]; meta: CatalogMeta } {
  const V = ACTORS.steakhouseEth;
  const target = { vault: V, holder: ACTORS.A };
  const finish = (label = "before the holder's exit"): ScenarioAction[] => [
    { type: "measure", label },
    exit(V, ACTORS.A, "holder exits everything (redeem all shares)"),
  ];
  const run = (id: string, title: string, pre: ScenarioAction[]): Scenario => ({
    id, title, target, hypotheses: [FORK_FACT, RUN_HYPOTHESIS],
    actions: [{ type: "measure", label: "source state" }, ...pre, ...finish()],
  });
  const runs: Scenario[] = [
    run("A_alone", "Holder exits alone", []),
    run("C_first", "Holder #3 exits first", [exit(V, ACTORS.C, "holder #3 exits")]),
    run("D_first", "Holder #4 exits first", [exit(V, ACTORS.D, "holder #4 exits")]),
    run("C_D_first", "Holders #3 and #4 exit first", [exit(V, ACTORS.C, "holder #3 exits"), exit(V, ACTORS.D, "holder #4 exits")]),
    run("B_first", "Holder #2 (Safe 3/5) exits first", [exit(V, ACTORS.B, "holder #2 exits")]),
    run("B_C_first", "Holders #2 then #3 exit first", [exit(V, ACTORS.B, "holder #2 exits"), exit(V, ACTORS.C, "holder #3 exits")]),
    run("VB1_other_vault", "Largest holder of ANOTHER vault (Vault Bridge WETH) exits first", [exit(ACTORS.vaultBridgeWeth, ACTORS.VB1, "Vault Bridge WETH #1 exits its own vault")]),
    run("B_both_vaults", "Holder #2 exits Gauntlet WETH Prime, then this vault", [
      exit(ACTORS.gauntletWethPrime, ACTORS.B, "holder #2 exits Gauntlet WETH Prime"), exit(V, ACTORS.B, "holder #2 exits this vault"),
    ]),
  ];
  // After a failed full exit, show what the holder can still take out.
  for (const s of runs) s.actions.push({ type: "exit", label: "holder withdraws its maximum", vault: V, owner: ACTORS.A, action: { kind: "withdrawMax" } }, { type: "measure", label: "end" });

  const rateFeed = g.nodes.find((n) => n.kind === "feed" && String(n.data.description).includes("wstETH/stETH"));
  const shocks: Scenario[] = [];
  if (rateFeed) {
    for (const f of [0.95, 0.9]) {
      const shock: Shock = { kind: "feed", feed: rateFeed.address!, factor: f, label: `wstETH/stETH rate x${f}` };
      const { actions } = shockActions(g, shock);
      shocks.push({
        id: `lido_loss_${Math.round((1 - f) * 100)}pct`,
        title: `Lido loss: stETH backing -${Math.round((1 - f) * 100)}% (seen by the exchange-rate oracle)`,
        target, hypotheses: [FORK_FACT, "Shock hypothesis: the oracle contract is replaced on the fork by one returning the shocked price.", "Every unhealthy borrower is liquidated by a liquidator with enough WETH (impersonated)."],
        actions: [{ type: "measure", label: "source state" }, ...actions, { type: "measure", label: "after shock and liquidations" }, ...finish("before the holder's exit"), { type: "exit", label: "holder withdraws its maximum", vault: V, owner: ACTORS.A, action: { kind: "withdrawMax" } }, { type: "measure", label: "end" }],
      });
    }
    // Incident = value shock + run: the two largest competing exits happen before the holder reacts.
    const { actions } = shockActions(g, { kind: "feed", feed: rateFeed.address!, factor: 0.9, label: "x0.9" });
    shocks.push({
      id: "incident_lido10_plus_run",
      title: "Incident: Lido loss -10%, liquidations, then holder #2 and Vault Bridge #1 run before the holder",
      target, hypotheses: [FORK_FACT, RUN_HYPOTHESIS, "Shock hypothesis: oracle replaced on the fork by one returning the shocked price; all unhealthy borrowers liquidated."],
      actions: [
        { type: "measure", label: "source state" }, ...actions, { type: "measure", label: "after shock and liquidations" },
        exit(V, ACTORS.B, "holder #2 exits"), exit(ACTORS.vaultBridgeWeth, ACTORS.VB1, "Vault Bridge WETH #1 exits its own vault"),
        ...finish("before the holder's exit"),
        { type: "exit", label: "holder withdraws its maximum", vault: V, owner: ACTORS.A, action: { kind: "withdrawMax" } }, { type: "measure", label: "end" },
      ],
    });
  }
  if (rateFeed) {
    const { actions } = shockActions(g, { kind: "feed", feed: rateFeed.address!, factor: 0.9, label: "x0.9" }, { dexLimited: true });
    shocks.push({
      id: "incident_lido10_dexlimited_plus_run",
      title: "Incident: Lido loss -10%, liquidations limited by AMM depth measured at the block, then holder #2 and Vault Bridge #1 run",
      target, hypotheses: [FORK_FACT, RUN_HYPOTHESIS, "Shock hypothesis: oracle replaced on the fork; only the borrowers whose collateral the measured AMM depth absorbs at a profit are liquidated."],
      actions: [
        { type: "measure", label: "source state" }, ...actions, { type: "measure", label: "after shock and liquidations" },
        exit(V, ACTORS.B, "holder #2 exits"), exit(ACTORS.vaultBridgeWeth, ACTORS.VB1, "Vault Bridge WETH #1 exits its own vault"),
        ...finish("before the holder's exit"),
        { type: "exit", label: "holder withdraws its maximum", vault: V, owner: ACTORS.A, action: { kind: "withdrawMax" } }, { type: "measure", label: "end" },
      ],
    });
  }
  // Oracle-blind incident: stETH trades below ETH but the exchange-rate oracle does not move.
  // Executed part: the liquidation sweep finds nothing to liquidate (oracle unchanged), then the run.
  // Value part (economic shortfall) comes from the analytic engine, labelled as such.
  const wstMarkets = g.markets.filter((m) => m.collateralSymbol === "wstETH" && m.vaultSupplyAssets > 0n);
  if (wstMarkets.length) shocks.push({
    id: "incident_steth_depeg_blind_plus_run",
    title: "Incident: stETH depegs on the market, the exchange-rate oracle does not see it; holder #2 and Vault Bridge #1 run first",
    target, hypotheses: [FORK_FACT, RUN_HYPOTHESIS, "The depeg is off-chain (DEX price); on-chain oracle unchanged, so no position becomes liquidatable."],
    actions: [
      { type: "measure", label: "source state" },
      ...wstMarkets.map((m): ScenarioAction => ({ type: "liquidateAll", label: `liquidation sweep in wstETH market #${m.queueIndex} (oracle unchanged)`, marketId: m.id, borrowers: (g.borrowers[m.id]?.list ?? []).map((b) => b.address) })),
      exit(V, ACTORS.B, "holder #2 exits"), exit(ACTORS.vaultBridgeWeth, ACTORS.VB1, "Vault Bridge WETH #1 exits its own vault"),
      ...finish("before the holder's exit"),
      { type: "exit", label: "holder withdraws its maximum", vault: V, owner: ACTORS.A, action: { kind: "withdrawMax" } }, { type: "measure", label: "end" },
    ],
  });
  const meta: CatalogMeta = {
    target, runIds: runs.map((s) => s.id),
    crossChecks: rateFeed ? [0.95, 0.9].map((f) => ({ id: `lido_loss_${Math.round((1 - f) * 100)}pct`, shock: { kind: "feed" as const, feed: rateFeed.address!, factor: f, label: `wstETH/stETH rate x${f}` } })) : [],
    incidents: {
      ...(wstMarkets.length ? { blind: { id: "incident_steth_depeg_blind_plus_run", collateral: ADDR.wstETH as Address, factor: 0.9 } } : {}),
      ...(rateFeed ? { shock: { id: "incident_lido10_plus_run", shock: { kind: "feed" as const, feed: rateFeed.address!, factor: 0.9, label: "wstETH/stETH rate x0.9" } } } : {}),
      ...(rateFeed ? { dexShock: { id: "incident_lido10_dexlimited_plus_run", shock: { kind: "feed" as const, feed: rateFeed.address!, factor: 0.9, label: "wstETH/stETH rate x0.9" } } } : {}),
    },
    cushionOther: ACTORS.B,
  };
  return { scenarios: [...runs, ...shocks], meta };
}
