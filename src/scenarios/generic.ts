/**
 * Scenario catalog derived automatically from any discovered MetaMorpho V1 graph:
 *   - target = a given holder (default: the largest holder)
 *   - competing exits = the next largest holders of the same vault, and the largest holder of each
 *     peer vault lending in the same markets (cross-vault contagion)
 *   - value shocks = the feed whose move hurts the vault most (analytic sweep), executed with
 *     liquidations; and an oracle-blind depeg of the main collateral, combined with a run.
 */
import { getAddress, type Address } from "viem";
import type { DependencyGraph } from "../discovery/types.ts";
import type { Scenario, ScenarioAction } from "../engine/scenario.ts";
import { propagate, type Shock } from "../shocks/analytic.ts";
import { FORK_FACT, RUN_HYPOTHESIS, shockActions } from "./catalog.ts";

export type CatalogMeta = {
  target: { vault: Address; holder: Address };
  runIds: string[];
  /** executed feed shocks to compare with the analytic engine */
  crossChecks: { id: string; shock: Shock }[];
  incidents: { blind?: { id: string; collateral: Address; factor: number }; shock?: { id: string; shock: Shock } };
  cushionOther: Address | null;
};

const exit = (vault: Address, owner: Address, label: string): ScenarioAction => ({ type: "exit", label, vault, owner, action: { kind: "redeemAll" } });

export function genericCatalog(g: DependencyGraph, holderIn?: Address): { scenarios: Scenario[]; meta: CatalogMeta } {
  const V = g.target.vault;
  const holders = g.holders.list;
  if (!holders.length) throw new Error("no holder discovered for this vault");
  const holder = holderIn ? getAddress(holderIn) : holders[0].address;
  const target = { vault: V, holder };
  const others = holders.filter((h) => h.address !== holder).slice(0, 3);
  const rank = (a: Address) => holders.findIndex((h) => h.address === a) + 1;

  // Peers ranked by how much of the target's exposed liquidity they share
  const exposed = g.markets.filter((m) => m.vaultSupplyAssets > 0n);
  const peerRank = g.peers
    .filter((p) => p.topHolder && p.topHolder.address !== holder)
    .map((p) => ({ p, shared: p.markets.filter((x) => exposed.some((m) => m.id === x.id)).reduce((s, x) => s + x.supplyAssets, 0n) }))
    .sort((a, b) => (b.shared > a.shared ? 1 : -1))
    .slice(0, 3);

  const finish = (): ScenarioAction[] => [
    { type: "measure", label: "before the holder's exit" },
    exit(V, holder, "holder exits everything (redeem all shares)"),
    { type: "exit", label: "holder withdraws its maximum", vault: V, owner: holder, action: { kind: "withdrawMax" } },
    { type: "measure", label: "end" },
  ];
  const run = (id: string, title: string, pre: ScenarioAction[]): Scenario => ({
    id, title, target, hypotheses: [FORK_FACT, RUN_HYPOTHESIS], actions: [{ type: "measure", label: "source state" }, ...pre, ...finish()],
  });
  const holderExit = (h: { address: Address }) => exit(V, h.address, `holder #${rank(h.address)} exits`);
  const peerExit = (x: (typeof peerRank)[number]) => exit(x.p.vault, x.p.topHolder!.address, `${x.p.name} #1 exits its own vault`);

  const scenarios: Scenario[] = [run("alone", "Holder exits alone", [])];
  for (const h of others) scenarios.push(run(`h${rank(h.address)}_first`, `Holder #${rank(h.address)} exits first`, [holderExit(h)]));
  if (others.length > 1) scenarios.push(run("top_holders_first", `Holders ${others.map((h) => "#" + rank(h.address)).join(", ")} exit first`, others.map(holderExit)));
  peerRank.forEach((x, i) => scenarios.push(run(`peer${i + 1}_first`, `Largest holder of ANOTHER vault (${x.p.name}) exits first`, [peerExit(x)])));
  if (others.length && peerRank.length)
    scenarios.push(run("all_first", "Everyone above exits first (same vault and peer vaults)", [...others.map(holderExit), ...peerRank.map(peerExit)]));
  const runIds = scenarios.map((s) => s.id);

  // Most damaging feed at -10% (analytic) -> executed with liquidations
  const feeds = g.nodes.filter((n) => n.kind === "feed");
  const ranked = feeds
    .map((f) => ({ f, r: propagate(g, { kind: "feed", feed: f.address!, factor: 0.9, label: "" }) }))
    .filter((x) => x.r.markets.some((m) => exposed.some((e) => e.id === m.id)))
    .sort((a, b) => (b.r.vaultLoss > a.r.vaultLoss ? 1 : -1));
  const meta: CatalogMeta = { target, runIds, crossChecks: [], incidents: {}, cushionOther: others[0]?.address ?? null };
  const shockHyps = [FORK_FACT, "Shock hypothesis: the oracle contract is replaced on the fork by one returning the shocked price.", "Every unhealthy borrower is liquidated by a liquidator with enough loan tokens (impersonated)."];
  const worstRun = [...others.slice(0, 1).map(holderExit), ...peerRank.slice(0, 1).map(peerExit)];
  const top = ranked[0];
  if (top && top.r.markets.length) {
    for (const f of [0.95, 0.9]) {
      const shock: Shock = { kind: "feed", feed: top.f.address!, factor: f, label: `${top.f.data.description} x${f}` };
      const id = `feed_shock_${Math.round((1 - f) * 100)}pct`;
      scenarios.push({
        id, title: `${top.f.data.description} feed -${Math.round((1 - f) * 100)}% (oracle sees it), all unhealthy borrowers liquidated`, target, hypotheses: shockHyps,
        actions: [{ type: "measure", label: "source state" }, ...shockActions(g, shock).actions, { type: "measure", label: "after shock and liquidations" }, ...finish()],
      });
      meta.crossChecks.push({ id, shock });
    }
    const shock: Shock = { kind: "feed", feed: top.f.address!, factor: 0.9, label: `${top.f.data.description} x0.9` };
    scenarios.push({
      id: "incident_feed_shock_plus_run",
      title: `Incident: ${top.f.data.description} -10% (oracle sees it), liquidations, then the largest competing holders exit first`,
      target, hypotheses: [...shockHyps, RUN_HYPOTHESIS],
      actions: [{ type: "measure", label: "source state" }, ...shockActions(g, shock).actions, { type: "measure", label: "after shock and liquidations" }, ...worstRun, ...finish()],
    });
    meta.incidents.shock = { id: "incident_feed_shock_plus_run", shock };
  }

  // Oracle-blind depeg of the main collateral (largest vault supply)
  const main = [...exposed].filter((m) => m.collateralSymbol !== "none").sort((a, b) => (b.vaultSupplyAssets > a.vaultSupplyAssets ? 1 : -1))[0];
  if (main) {
    const sameColl = exposed.filter((m) => m.params.collateralToken === main.params.collateralToken);
    scenarios.push({
      id: "incident_blind_depeg_plus_run",
      title: `Incident: ${main.collateralSymbol} depegs on the market, oracles unchanged; the largest competing holders exit first`,
      target, hypotheses: [FORK_FACT, RUN_HYPOTHESIS, "The depeg is off-chain (DEX price); on-chain oracle unchanged, so no position becomes liquidatable."],
      actions: [
        { type: "measure", label: "source state" },
        ...sameColl.map((m): ScenarioAction => ({ type: "liquidateAll", label: `liquidation sweep in ${m.collateralSymbol} market #${m.queueIndex} (oracle unchanged)`, marketId: m.id, borrowers: (g.borrowers[m.id]?.list ?? []).map((b) => b.address) })),
        ...worstRun, ...finish(),
      ],
    });
    meta.incidents.blind = { id: "incident_blind_depeg_plus_run", collateral: main.params.collateralToken, factor: 0.9 };
  }
  return { scenarios, meta };
}
