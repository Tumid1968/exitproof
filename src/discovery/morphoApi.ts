/**
 * Morpho public GraphQL API, used ONLY to enumerate candidate addresses (peer vaults, borrowers).
 * Reason: the free archive RPC does not serve historical eth_getLogs. No value from the API is
 * used as-is: every candidate is re-read on-chain at the frozen block, and completeness is
 * measured on-chain (sum of found shares / total shares of the market).
 * Responses are cached on disk so discovery also runs offline (EXITPROOF_OFFLINE=1).
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getAddress, type Address, type Hex } from "viem";

export const MORPHO_API = "https://blue-api.morpho.org/graphql";
const CACHE = join(process.cwd(), "cache", "api");

export type ApiRecord = { id: string; source: "morpho-api"; query: string; fetchedAt: string; resultCount: number };

async function gql<T>(query: string): Promise<{ data: T; fetchedAt: string }> {
  const key = createHash("sha256").update(query).digest("hex");
  const file = join(CACHE, key + ".json");
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8"));
  if (process.env.EXITPROOF_OFFLINE === "1") throw new Error("offline and Morpho API answer not cached: " + query.slice(0, 80));
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(MORPHO_API, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query }) });
    const j = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (j.data && !j.errors) {
      const out = { data: j.data, fetchedAt: new Date().toISOString() };
      mkdirSync(CACHE, { recursive: true });
      writeFileSync(file, JSON.stringify(out));
      return out;
    }
    if (attempt >= 3) throw new Error("Morpho API error: " + JSON.stringify(j.errors));
    await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
  }
}

export async function supplyingVaultCandidates(marketIds: Hex[]): Promise<{ addresses: Address[]; rec: Omit<ApiRecord, "id"> }> {
  const query = `{ markets(first: 100, where:{uniqueKey_in:${JSON.stringify(marketIds)}, chainId_in:[1]}) { items { marketId supplyingVaults { address } } } }`;
  const { data, fetchedAt } = await gql<{ markets: { items: { supplyingVaults: { address: string }[] }[] } }>(query);
  const addresses = [...new Set(data.markets.items.flatMap((m) => m.supplyingVaults.map((v) => getAddress(v.address))))];
  return { addresses, rec: { source: "morpho-api", query, fetchedAt, resultCount: addresses.length } };
}

export async function borrowerCandidates(marketId: Hex): Promise<{ addresses: Address[]; rec: Omit<ApiRecord, "id"> }> {
  const all: Address[] = [];
  let skip = 0;
  let fetchedAt = "";
  const queries: string[] = [];
  for (;;) {
    const query = `{ marketPositions(first: 500, skip: ${skip}, where:{marketUniqueKey_in:["${marketId}"], chainId_in:[1], borrowShares_gte: "1"}) { pageInfo { countTotal count } items { user { address } } } }`;
    queries.push(query);
    const r = await gql<{ marketPositions: { pageInfo: { countTotal: number; count: number }; items: { user: { address: string } }[] } }>(query);
    fetchedAt = r.fetchedAt;
    all.push(...r.data.marketPositions.items.map((x) => getAddress(x.user.address)));
    skip += r.data.marketPositions.pageInfo.count;
    if (r.data.marketPositions.pageInfo.count === 0 || skip >= r.data.marketPositions.pageInfo.countTotal) break;
  }
  const addresses = [...new Set(all)];
  return { addresses, rec: { source: "morpho-api", query: queries.join("\n"), fetchedAt, resultCount: addresses.length } };
}

export async function holderCandidates(vault: Address, first = 25): Promise<{ addresses: Address[]; rec: Omit<ApiRecord, "id"> }> {
  const query = `{ vaultPositions(first: ${first}, orderBy: Shares, orderDirection: Desc, where:{vaultAddress_in:["${vault}"], chainId_in:[1]}) { items { user { address } } } }`;
  const { data, fetchedAt } = await gql<{ vaultPositions: { items: { user: { address: string } }[] } }>(query);
  const addresses = [...new Set(data.vaultPositions.items.map((x) => getAddress(x.user.address)))];
  return { addresses, rec: { source: "morpho-api", query, fetchedAt, resultCount: addresses.length } };
}
