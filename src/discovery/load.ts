import { readFileSync } from "node:fs";
import { getAddress, type Address } from "viem";
import type { DependencyGraph } from "./types.ts";

const big = (o: Record<string, unknown>, keys: string[]) => {
  for (const k of keys) if (typeof o[k] === "string" && /^-?\d+$/.test(o[k] as string)) o[k] = BigInt(o[k] as string);
};

/** Load a discovery JSON and revive the bigint fields the engines compute with. */
export function loadGraph(vault: Address): DependencyGraph {
  const g = JSON.parse(readFileSync(`results/discovery/${getAddress(vault)}.json`, "utf8")) as DependencyGraph;
  for (const m of g.markets) {
    big(m as never, ["totalSupplyAssets", "totalSupplyShares", "totalBorrowAssets", "totalBorrowShares", "lastUpdate", "fee",
      "vaultSupplyShares", "vaultSupplyAssets", "liquidity", "vaultWithdrawable", "cap", "oraclePrice"]);
    big(m.params as never, ["lltv"]);
  }
  for (const b of Object.values(g.borrowers)) for (const x of b.list) big(x as never, ["borrowShares", "collateral", "debt"]);
  for (const h of g.holders?.list ?? []) big(h as never, ["shares", "assets"]);
  for (const p of g.peers) {
    if (p.topHolder) big(p.topHolder as never, ["shares", "assets"]);
    big(p as never, ["totalAssets"]);
    for (const m of p.markets) big(m as never, ["supplyAssets"]);
  }
  for (const d of Object.values(g.dex ?? {})) { big(d as never, ["capacity", "collateralAtRisk"]); for (const v of d.venues) big(v as never, ["capacity"]); }
  big(g.summary, ["totalAssets", "totalSupply", "withdrawableNow", "lentOutNotWithdrawable", "publicAllocatorReallocatableIntoExposedMarkets"]);
  return g;
}
