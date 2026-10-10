/**
 * Analytic shock propagation over a discovered dependency graph.
 *
 * A shock hits one dependency node (a price feed, a collateral's market price, an oracle) by a
 * multiplicative factor. It is propagated along the *discovered* edges only:
 *   feed --(BASE/QUOTE slot)--> oracle --(router: active leg only)--> market --> borrowers --> vault --> holder
 * Value loss = bad debt realised when liquidators seize all collateral of positions the shocked
 * oracle price makes insolvent (Morpho Blue socialises it to suppliers pro rata of supply shares).
 * Liquidity effect = debt repaid by those liquidations returns to the market as idle liquidity.
 *
 * Hypotheses (shown with every result): liquidators act on every liquidatable position, borrowers do
 * not top up, prices move instantly, no other actor reacts. These are scenario assumptions, not predictions.
 */
import { getAddress, type Address, type Hex } from "viem";
import type { DependencyGraph, MarketState } from "../discovery/types.ts";

const WAD = 10n ** 18n;
const ORACLE_SCALE = 10n ** 36n;

export type Shock =
  /** A feed's answer is multiplied by factor (e.g. Lido slashing on the wstETH/stETH rate, custody loss on cbBTC/USD). */
  | { kind: "feed"; feed: Address; factor: number; label: string }
  /** The collateral's real market value drops but the oracle does not see it (e.g. stETH depeg vs exchange-rate oracle). */
  | { kind: "blindDepeg"; collateral: Address; factor: number; label: string }
  /** The oracle overprices collateral by factor > 1 (bug/manipulation): liquidity can be borrowed against too little collateral. */
  | { kind: "oracleOverprice"; oracle: Address; factor: number; label: string };

export type MarketImpact = {
  id: Hex;
  label: string;
  priceFactorSeenByOracle: number;
  path: string[];
  liquidatable: number;
  /** liquidatable but not absorbed by AMM depth (dexLimited only) */
  unliquidated: number;
  liquidatedBorrowers: Address[];
  badDebt: bigint;
  repaidByLiquidations: bigint;
  /** economic shortfall not recognised on-chain (blind depeg) */
  hiddenShortfall: bigint;
  vaultLoss: bigint;
  vaultHiddenLoss: bigint;
  liquidityAfter: bigint;
  vaultSupplyAfter: bigint;
  vaultWithdrawableAfter: bigint;
};

export type ShockResult = {
  shock: Shock;
  markets: MarketImpact[];
  vaultLoss: bigint;
  vaultLossPct: number;
  vaultHiddenLoss: bigint;
  vaultWithdrawableBefore: bigint;
  vaultWithdrawableAfter: bigint;
  hypotheses: string[];
};

const nodeBy = (g: DependencyGraph, id: string) => g.nodes.find((n) => n.id === id);
const outEdges = (g: DependencyGraph, id: string) => g.edges.filter((e) => e.from === id);

/** Multiplicative factor on an oracle's price when `feed` is multiplied by f, following discovered edges. */
function oracleFactorForFeed(g: DependencyGraph, oracleId: string, feed: Address, f: number, path: string[]): number {
  const node = nodeBy(g, oracleId);
  if (!node) return 1;
  if (node.data.router) {
    const active = node.data.isPrimary === false ? "backup leg" : "primary leg";
    const leg = outEdges(g, oracleId).find((e) => e.rel === active);
    if (!leg) return 1;
    const sub = [...path, `${node.label} -> ${active}`];
    const r = oracleFactorForFeed(g, leg.to, feed, f, sub);
    if (r !== 1) path.push(...sub.slice(path.length));
    return r;
  }
  let factor = 1;
  for (const e of outEdges(g, oracleId)) {
    if (e.to !== `feed:${getAddress(feed)}`) continue;
    if (e.rel.startsWith("BASE_FEED")) { factor *= f; path.push(`${node.label} ${e.rel} x${f}`); }
    if (e.rel.startsWith("QUOTE_FEED")) { factor /= f; path.push(`${node.label} ${e.rel} /${f}`); }
  }
  return factor;
}

const toBig = (x: number) => BigInt(Math.round(x * 1e12));
const scale = (v: bigint, factor: number) => (v * toBig(factor)) / 10n ** 12n;
const min = (a: bigint, b: bigint) => (a < b ? a : b);

/** Morpho Blue liquidation incentive factor (WAD). */
export const lifWad = (lltv: bigint) => {
  const cursor = 3n * 10n ** 17n; // 0.3
  const denom = (cursor * lltv) / WAD + WAD - cursor;
  const lif = (WAD * WAD) / denom;
  const maxLif = 115n * 10n ** 16n;
  return lif < maxLif ? lif : maxLif;
};

export type PropagateOptions = {
  /** Liquidations limited by the AMM depth measured at the block (shared per collateral across markets). */
  dexLimited?: boolean;
};

export function propagate(g: DependencyGraph, shock: Shock, opts: PropagateOptions = {}): ShockResult {
  const impacts: MarketImpact[] = [];
  // Shared liquidation budget per collateral: the same pools absorb the seized collateral of every market.
  const budgets = new Map<string, { left: bigint }>();
  if (opts.dexLimited) for (const m of g.markets) {
    const d = g.dex?.[m.id];
    if (!d) continue;
    const k = getAddress(m.params.collateralToken);
    const cur = budgets.get(k);
    if (!cur || d.capacity > cur.left) budgets.set(k, { left: d.capacity });
  }
  // Higher liquidation incentive = liquidators served first
  const ordered = [...g.markets].sort((a, b) => (lifWad(b.params.lltv) > lifWad(a.params.lltv) ? 1 : -1));
  for (const m of ordered) {
    if (m.params.oracle === "0x0000000000000000000000000000000000000000") continue;
    const path: string[] = [];
    let seen = 1;
    let blindFactor = 1;
    const mNode = `market:${m.id}`;
    if (shock.kind === "feed") {
      seen = oracleFactorForFeed(g, `oracle:${getAddress(m.params.oracle)}`, shock.feed, shock.factor, path);
    } else if (shock.kind === "blindDepeg") {
      if (getAddress(m.params.collateralToken) !== getAddress(shock.collateral)) continue;
      blindFactor = shock.factor;
      path.push(`collateral ${m.collateralSymbol} market value x${shock.factor}; oracle unchanged`);
    } else if (shock.kind === "oracleOverprice") {
      if (getAddress(m.params.oracle) !== getAddress(shock.oracle)) continue;
      seen = shock.factor;
      path.push(`oracle ${m.params.oracle.slice(0, 10)} overprices x${shock.factor}`);
    }
    if (seen === 1 && blindFactor === 1) continue;
    const budget = opts.dexLimited ? budgets.get(getAddress(m.params.collateralToken)) ?? { left: 0n } : null;
    impacts.push(impactOnMarket(g, m, seen, blindFactor, shock.kind === "oracleOverprice", [mNode, ...path], budget));
  }
  const vaultLoss = impacts.reduce((s, i) => s + i.vaultLoss, 0n);
  const totalAssets = BigInt(g.summary.totalAssets as string | bigint);
  const wBefore = g.markets.reduce((s, m) => s + m.vaultWithdrawable, 0n);
  const wAfter = g.markets.reduce((s, m) => {
    const imp = impacts.find((i) => i.id === m.id);
    return s + (imp ? imp.vaultWithdrawableAfter : m.vaultWithdrawable);
  }, 0n);
  return {
    shock, markets: impacts, vaultLoss,
    vaultLossPct: totalAssets === 0n ? 0 : Number((vaultLoss * 1_000_000n) / totalAssets) / 1e4,
    vaultHiddenLoss: impacts.reduce((s, i) => s + i.vaultHiddenLoss, 0n),
    vaultWithdrawableBefore: wBefore, vaultWithdrawableAfter: wAfter,
    hypotheses: [
      "Liquidators liquidate every liquidatable position in full; borrowers do not add collateral or repay first.",
      "Shock is instantaneous; interest accrual during the event is ignored in this analytic estimate (the fork run includes it).",
      shock.kind === "blindDepeg" ? "The oracle does not observe this price: the loss is economic (unrecognised on-chain) and no liquidation brings liquidity back." : "The shocked price is what the oracle returns to Morpho Blue.",
      shock.kind === "oracleOverprice" ? "Worst case: an actor borrows all idle liquidity against collateral valued at the overpriced oracle and walks away." : "",
      opts.dexLimited ? "Liquidations stop when the AMM pools measured at the block can no longer absorb the seized collateral at a profit (depth assumed to scale with the shocked price); insolvent positions left over are an unrecognised shortfall and bring no liquidity back." : "",
    ].filter(Boolean),
  };
}

function impactOnMarket(g: DependencyGraph, m: MarketState, seen: number, blind: number, overprice: boolean, path: string[], budget: { left: bigint } | null): MarketImpact {
  const list = g.borrowers[m.id]?.list ?? [];
  const price = m.oraclePrice ?? 0n;
  const pSeen = scale(price, seen);
  const pReal = scale(price, blind * (overprice ? 1 : 1));
  const lif = lifWad(m.params.lltv);
  let badDebt = 0n, repaid = 0n, hidden = 0n, liquidatable = 0, unliquidated = 0;
  const liquidated: Address[] = [];
  if (overprice) {
    // Borrow max against collateral bought at the true price: profitable iff LLTV * factor > 1.
    // Each unit of true collateral value lets one borrow LLTV*factor: the lender loss per unit borrowed is 1 - 1/(LLTV*factor).
    const lf = (Number(m.params.lltv) / 1e18) * seen;
    if (lf > 1) badDebt = scale(m.liquidity, 1 - 1 / lf);
  } else {
    const sorted = budget ? [...list].sort((a, b) => (BigInt(b.debt) > BigInt(a.debt) ? 1 : -1)) : list;
    for (const b of sorted) {
      const debt = BigInt(b.debt as unknown as string);
      const coll = BigInt(b.collateral as unknown as string);
      const collSeen = (coll * pSeen) / ORACLE_SCALE;
      // liquidatable if debt > collateral * LLTV at the oracle price
      if (debt * WAD > collSeen * m.params.lltv) {
        liquidatable++;
        const maxRepay = (collSeen * WAD) / lif; // repaying this seizes all collateral
        const seized = maxRepay < debt ? coll : pSeen === 0n ? coll : (((debt * lif) / WAD) * ORACLE_SCALE) / pSeen;
        if (budget && seized > budget.left) {
          // nobody can sell this collateral at a profit: position stays, shortfall unrecognised, no liquidity back
          unliquidated++;
          if (debt > collSeen) hidden += debt - collSeen;
          continue;
        }
        if (budget) budget.left -= seized;
        liquidated.push(b.address);
        if (maxRepay < debt) { badDebt += debt - maxRepay; repaid += maxRepay; } else repaid += debt;
      }
      if (blind !== 1) {
        const collReal = (coll * pReal) / ORACLE_SCALE;
        const real = (collReal * toBig(blind)) / 10n ** 12n;
        if (debt > real) hidden += debt - real;
      }
    }
  }
  if (badDebt > m.totalSupplyAssets) badDebt = m.totalSupplyAssets;
  const vaultLoss = m.totalSupplyShares === 0n ? 0n : (badDebt * m.vaultSupplyShares) / m.totalSupplyShares;
  const vaultHidden = m.totalSupplyShares === 0n ? 0n : (hidden * m.vaultSupplyShares) / m.totalSupplyShares;
  const liquidityAfter = overprice ? m.liquidity - min(m.liquidity, m.liquidity) : m.liquidity + repaid;
  const vaultSupplyAfter = m.vaultSupplyAssets - vaultLoss;
  return {
    id: m.id,
    label: `${m.collateralSymbol}/${g.target.assetSymbol} LLTV ${(Number(m.params.lltv) / 1e16).toFixed(1)}% (queue #${m.queueIndex})`,
    priceFactorSeenByOracle: seen, path, liquidatable, unliquidated, liquidatedBorrowers: liquidated,
    badDebt, repaidByLiquidations: repaid, hiddenShortfall: hidden,
    vaultLoss, vaultHiddenLoss: vaultHidden,
    liquidityAfter, vaultSupplyAfter, vaultWithdrawableAfter: min(vaultSupplyAfter, liquidityAfter),
  };
}
