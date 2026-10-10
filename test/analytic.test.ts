/** Analytic shock engine on a hand-built graph whose answers are computable by hand. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { propagate } from "../src/shocks/analytic.ts";
import type { DependencyGraph } from "../src/discovery/types.ts";
import { getAddress } from "viem";

const E = 10n ** 18n;
const FEED = getAddress("0x00000000000000000000000000000000000000f1");
const ORACLE = getAddress("0x00000000000000000000000000000000000000a1");
const COLL = getAddress("0x00000000000000000000000000000000000000c1");
const ID = "0x" + "11".repeat(32);

/** One market (LLTV 94.5 %, price 1:1), one borrower (debt 94, collateral 100: healthy at the source price); the vault owns half of the supply. */
function graph(): DependencyGraph {
  return {
    schema: "exitproof.graph/0.1",
    source: { chainId: 1, block: "1", blockHash: "0x", timestamp: "0", baseFeePerGas: null },
    target: { vault: "0x00000000000000000000000000000000000000b1", name: "t", version: "MetaMorpho V1.0", asset: "0x00000000000000000000000000000000000000d1", assetSymbol: "WETH", assetDecimals: 18 },
    summary: { totalAssets: 100n * E },
    markets: [{
      id: ID as `0x${string}`, queueIndex: 0,
      params: { loanToken: "0x00000000000000000000000000000000000000d1", collateralToken: COLL, oracle: ORACLE, irm: "0x00000000000000000000000000000000000000e1", lltv: 945n * 10n ** 15n },
      totalSupplyAssets: 200n * E, totalSupplyShares: 200n * E * 10n ** 6n, totalBorrowAssets: 94n * E, totalBorrowShares: 94n * E * 10n ** 6n, lastUpdate: 0n, fee: 0n,
      vaultSupplyShares: 100n * E * 10n ** 6n, vaultSupplyAssets: 100n * E, liquidity: 106n * E, vaultWithdrawable: 100n * E,
      utilization: 0.47, borrowApr: null, supplyApr: null, cap: 0n, collateralSymbol: "X", collateralDecimals: 18, loanDecimals: 18,
      oraclePrice: 10n ** 36n,
    }],
    peers: [], holders: { coverage: 1, list: [] }, dex: {},
    borrowers: { [ID]: { coverage: 1, count: 1, list: [{ address: "0x00000000000000000000000000000000000000ee", borrowShares: 94n * E * 10n ** 6n, collateral: 100n * E, debt: 94n * E, ltv: 0.94 }] } },
    nodes: [
      { id: `oracle:${ORACLE}`, kind: "oracle", layer: 3, label: "o", data: {}, prov: [] },
      { id: `feed:${FEED}`, kind: "feed", layer: 4, label: "f", data: {}, prov: [] },
    ],
    edges: [{ from: `oracle:${ORACLE}`, to: `feed:${FEED}`, rel: "BASE_FEED_1", prov: [] }],
    reads: [], notes: [],
  } as unknown as DependencyGraph;
}

const close = (a: bigint, b: number, tol = 1e-9) => assert.ok(Math.abs(Number(a) / 1e18 - b) < tol, `${Number(a) / 1e18} vs ${b}`);

test("oracle-blind depeg -10%: shortfall = debt - collateral * 0.9, applied once", () => {
  const r = propagate(graph(), { kind: "blindDepeg", collateral: COLL, factor: 0.9, label: "" });
  close(r.markets[0].hiddenShortfall, 94 - 90);      // 4, not 94 - 81
  close(r.vaultHiddenLoss, 2);                     // vault owns half the supply
  assert.equal(r.markets[0].liquidatable, 0);        // oracle unchanged: nothing liquidatable
  close(r.vaultLoss, 0);
});

test("feed -10% seen by the oracle: full liquidation, bad debt = debt - collateral value / LIF", () => {
  const r = propagate(graph(), { kind: "feed", feed: FEED, factor: 0.9, label: "" });
  const lif = 1 / (0.3 * 0.945 + 0.7);
  assert.equal(r.markets[0].liquidatable, 1);
  close(r.markets[0].badDebt, 94 - 90 / lif, 1e-6);
  close(r.vaultLoss, (94 - 90 / lif) / 2, 1e-6);
  close(r.markets[0].repaidByLiquidations, 90 / lif, 1e-6);
});

test("quote-slot feed moves the price the other way", () => {
  const g = graph();
  g.edges[0].rel = "QUOTE_FEED_1";
  const r = propagate(g, { kind: "feed", feed: FEED, factor: 0.9, label: "" });
  assert.equal(r.markets[0].liquidatable, 0); // price / 0.9 goes up: healthier
});

test("AMM-limited: no depth -> no liquidation, shortfall unrecognised", () => {
  const g = graph();
  g.dex = { [ID]: { capacity: 0n, collateralAtRisk: 100n * E, venues: [] } };
  const r = propagate(g, { kind: "feed", feed: FEED, factor: 0.9, label: "" }, { dexLimited: true });
  assert.equal(r.markets[0].unliquidated, 1);
  close(r.vaultLoss, 0);
  close(r.markets[0].hiddenShortfall, 4);
});
