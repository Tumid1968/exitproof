import { formatUnits } from "viem";

export async function pmap<T, R>(items: T[], concurrency: number, fn: (x: T, i: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length);
  let i = 0;
  const worker = async () => {
    while (i < items.length) {
      const j = i++;
      out[j] = await fn(items[j], j);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return out;
}

export const fmt = (wei: bigint | string, decimals = 18, dp = 2) =>
  Number(formatUnits(BigInt(wei), decimals)).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });

/** JSON with bigint as decimal strings. */
export const toJson = (v: unknown) =>
  JSON.stringify(v, (_k, x) => (typeof x === "bigint" ? x.toString() : x), 2);

export const WAD = 10n ** 18n;
export const mulDivDown = (a: bigint, b: bigint, d: bigint) => (a * b) / d;
export const mulDivUp = (a: bigint, b: bigint, d: bigint) => (a * b + d - 1n) / d;
/** Morpho Blue SharesMathLib (virtual shares 1e6, virtual assets 1). */
export const toAssetsDown = (shares: bigint, totalAssets: bigint, totalShares: bigint) =>
  mulDivDown(shares, totalAssets + 1n, totalShares + 1_000_000n);
export const toAssetsUp = (shares: bigint, totalAssets: bigint, totalShares: bigint) =>
  mulDivUp(shares, totalAssets + 1n, totalShares + 1_000_000n);

/** Percentage change (a − b) / b × 100, rounded (half away from zero) to `dp` decimals, exact on bigints. */
export { pctChange } from "../verdict/pct.ts";
