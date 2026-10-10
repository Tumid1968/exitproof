/**
 * AMM layer: where a liquidator can sell seized collateral, and how much before it stops paying.
 *
 * Venues are discovered on-chain at the frozen block: Uniswap V3 pools (factory getPool on every fee tier)
 * and Curve pools (MetaRegistry find_pools_for_coins), for the collateral directly against the loan token,
 * and through the collateral's underlying when it is a wrapper exposing stETH() (wstETH -> stETH, exact unwrap).
 * Capacity of a venue = the largest amount whose quoted proceeds still cover what the liquidator repays:
 * proceeds(x) >= x * oraclePrice / LIF  (liquidation is profitable before gas). Quotes are eth_calls at the block.
 */
import { getAddress, parseAbi, zeroAddress, type Address } from "viem";
import type { Reader } from "./reader.ts";

const UNIV3_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984" as Address;
const UNIV3_QUOTER_V2 = "0x61fFE014bA17989E743c5F6cB21bF9697530B21e" as Address;
const CURVE_META_REGISTRY = "0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC" as Address;
const ETH_PLACEHOLDER = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE" as Address;
const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2" as Address;

const univ3FactoryAbi = parseAbi(["function getPool(address,address,uint24) view returns (address)"]);
const quoterAbi = parseAbi(["function quoteExactInputSingle((address tokenIn,address tokenOut,uint256 amountIn,uint24 fee,uint160 sqrtPriceLimitX96)) returns (uint256 amountOut,uint160 sqrtPriceX96After,uint32 initializedTicksCrossed,uint256 gasEstimate)"]);
const registryAbi = parseAbi([
  "function find_pools_for_coins(address,address) view returns (address[])",
  "function get_coin_indices(address,address,address) view returns (int128,int128,bool)",
]);
const curve128 = parseAbi(["function get_dy(int128,int128,uint256) view returns (uint256)"]);
const curve256 = parseAbi(["function get_dy(uint256,uint256,uint256) view returns (uint256)"]);
const wrapperAbi = parseAbi(["function stETH() view returns (address)", "function getStETHByWstETH(uint256) view returns (uint256)"]);

export type Venue = {
  id: string;
  kind: "uniswap-v3" | "curve" | "two-hop";
  /** two-hop routes share their second pool: count only the best one (lower bound) */
  hops?: 2;
  pool: Address;
  route: string;
  /** proceeds in loan-token units for `amount` collateral units, or null if the quote fails */
  quote: (amount: bigint) => Promise<bigint | null>;
  prov: string[];
};

export async function discoverVenues(r: Reader, collateral: Address, loanToken: Address): Promise<Venue[]> {
  const venues: Venue[] = [];
  const legs: { from: Address; to: Address; pre: (x: bigint) => Promise<bigint>; preLabel: string; prov: string[] }[] = [
    { from: collateral, to: loanToken, pre: async (x) => x, preLabel: "", prov: [] },
  ];
  // Wrapper (wstETH-like): exact unwrap, then sell the underlying
  const [under, uId] = await r.call<Address>(collateral, wrapperAbi, "stETH");
  if (under && under !== zeroAddress) {
    const unwrap = async (x: bigint) => (await r.rawCall<bigint>(collateral, wrapperAbi, "getStETHByWstETH", [x])) ?? 0n;
    legs.push({ from: under, to: loanToken, pre: unwrap, preLabel: "unwrap → ", prov: [uId] });
    if (getAddress(loanToken) === getAddress(WETH)) legs.push({ from: under, to: ETH_PLACEHOLDER, pre: unwrap, preLabel: "unwrap → ", prov: [uId] });
  }
  for (const leg of legs) {
    // Uniswap V3
    if (leg.to !== ETH_PLACEHOLDER) for (const fee of [100, 500, 3000, 10000]) {
      const [pool, pId] = await r.call<Address>(UNIV3_FACTORY, univ3FactoryAbi, "getPool", [leg.from, leg.to, fee]);
      if (!pool || pool === zeroAddress) continue;
      venues.push({
        id: `univ3:${pool}`, kind: "uniswap-v3", pool, route: `${leg.preLabel}Uniswap V3 ${fee / 10000}% pool`, prov: [...leg.prov, pId],
        quote: async (x) => {
          const amt = await leg.pre(x);
          const res = await r.rawCall<readonly [bigint, bigint, number, bigint]>(UNIV3_QUOTER_V2, quoterAbi, "quoteExactInputSingle", [{ tokenIn: leg.from, tokenOut: leg.to, amountIn: amt, fee, sqrtPriceLimitX96: 0n }]);
          return res ? res[0] : null;
        },
      });
    }
    // Curve
    const [pools, cId] = await r.call<readonly Address[]>(CURVE_META_REGISTRY, registryAbi, "find_pools_for_coins", [leg.from, leg.to]);
    for (const pool of pools ?? []) {
      const [idx, iId] = await r.call<readonly [bigint, bigint, boolean]>(CURVE_META_REGISTRY, registryAbi, "get_coin_indices", [pool, leg.from, leg.to]);
      if (!idx || idx[2]) continue; // underlying (meta) swaps skipped
      const [i, j] = idx;
      venues.push({
        id: `curve:${pool}`, kind: "curve", pool, route: `${leg.preLabel}Curve pool ${pool.slice(0, 8)}…`, prov: [...leg.prov, cId, iId],
        quote: async (x) => {
          const amt = await leg.pre(x);
          const a = await r.rawCall<bigint>(pool, curve128, "get_dy", [i, j, amt]);
          if (a !== undefined) return a;
          const b = await r.rawCall<bigint>(pool, curve256, "get_dy", [i, j, amt]);
          return b ?? null;
        },
      });
    }
  }
  // Two hops through WETH when the loan token is not WETH: liquidators route via the deepest WETH pool.
  if (getAddress(loanToken) !== getAddress(WETH) && getAddress(collateral) !== getAddress(WETH)) {
    let best: { fee: number; pool: Address; out: bigint; prov: string } | null = null;
    for (const fee of [100, 500, 3000, 10000]) {
      const [pool, pId] = await r.call<Address>(UNIV3_FACTORY, univ3FactoryAbi, "getPool", [WETH, loanToken, fee]);
      if (!pool || pool === zeroAddress) continue;
      const [res] = await r.call<readonly [bigint, bigint, number, bigint]>(UNIV3_QUOTER_V2, quoterAbi, "quoteExactInputSingle", [{ tokenIn: WETH, tokenOut: loanToken, amountIn: 100n * 10n ** 18n, fee, sqrtPriceLimitX96: 0n }]);
      if (res && (!best || res[0] > best.out)) best = { fee, pool, out: res[0], prov: pId };
    }
    if (best) {
      const second = best;
      const firstLegs = await discoverVenues(r, collateral, WETH);
      for (const v of firstLegs) {
        venues.push({
          id: `2hop:${v.pool}:${second.pool}`, kind: "two-hop", hops: 2, pool: v.pool,
          route: `${v.route} → WETH → Uniswap V3 ${second.fee / 10000}% pool`, prov: [...v.prov, second.prov],
          quote: async (x) => {
            const weth = await v.quote(x);
            if (!weth) return null;
            const res = await r.rawCall<readonly [bigint, bigint, number, bigint]>(UNIV3_QUOTER_V2, quoterAbi, "quoteExactInputSingle", [{ tokenIn: WETH, tokenOut: loanToken, amountIn: weth, fee: second.fee, sqrtPriceLimitX96: 0n }]);
            return res ? res[0] : null;
          },
        });
      }
    }
  }
  return venues;
}

/**
 * Largest collateral amount (smallest units) a venue absorbs while proceeds >= amount * price / lif.
 * Geometric then binary search; ~30 quotes per venue. `price` is the Morpho oracle price (scale 1e36).
 */
export async function venueCapacity(v: Venue, price: bigint, lifWad: bigint, unit: bigint, maxUnits: bigint, decimalsShift = 0): Promise<{ capacity: bigint; avgPriceAtCapacity: number | null; quotes: number }> {
  const avg = (out: bigint | null, x: bigint) => (out && x > 0n ? (Number((out * 10n ** 12n) / x) / 1e12) * 10 ** decimalsShift : null);
  let quotes = 0;
  const ok = async (x: bigint) => {
    if (x === 0n) return true;
    const out = await v.quote(x);
    quotes++;
    if (out === null) return false;
    const need = (x * price * 10n ** 18n) / 10n ** 36n / lifWad; // repaid by the liquidator for x collateral
    return out >= need;
  };
  if (!(await ok(unit / 1000n || 1n))) return { capacity: 0n, avgPriceAtCapacity: null, quotes };
  let lo = unit / 1000n || 1n;
  let hi = lo;
  while (hi < maxUnits && (await ok(hi * 4n))) { lo = hi * 4n; hi = lo; }
  hi = hi * 4n > maxUnits ? maxUnits : hi * 4n;
  if (await ok(hi)) return { capacity: hi, avgPriceAtCapacity: avg(await v.quote(hi), hi), quotes };
  // stop at 2 % relative precision (or 0.01 unit): enough for a capacity estimate, ~6-8 quotes instead of ~18
  for (let k = 0; k < 18 && hi - lo > unit / 100n && (hi - lo) * 50n > hi; k++) {
    const mid = (lo + hi) / 2n;
    if (await ok(mid)) lo = mid; else hi = mid;
  }
  const out = await v.quote(lo);
  quotes++;
  return { capacity: lo, avgPriceAtCapacity: avg(out, lo), quotes };
}
