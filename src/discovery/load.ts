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
  for (const p of g.peers) {
    big(p as never, ["totalAssets"]);
    for (const m of p.markets) big(m as never, ["supplyAssets"]);
  }
  big(g.summary, ["totalAssets", "totalSupply", "withdrawableNow", "lentOutNotWithdrawable", "publicAllocatorReallocatableIntoExposedMarkets"]);
  return g;
}
