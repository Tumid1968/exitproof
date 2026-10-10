/**
 * Reference yields used to turn the vault's yield spread into an implied (risk-neutral) loss probability:
 *   p_implied(H) ≈ (vault net APY − reference yield) × H/365 / ℓ,   ℓ = loss fraction of the incident
 * (the classic credit approximation PD ≈ spread / LGD). Every reference is read on-chain at the frozen block,
 * or measured from archive state, and carries its source. None is a prediction.
 */
import { createPublicClient, http, parseAbi } from "viem";
import { PROXY_URL, SOURCE } from "../lib/constants.ts";

export type ReferenceRate = { name: string; apy: number; source: string; note: string };

const SUSDS = "0xa3931d71877C0E7a3148CB7Eb4463524FEc27fbD" as const;
const WSTETH = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0" as const;
const USD = ["USDC", "USDT", "DAI", "USDS", "PYUSD", "USDE", "RLUSD", "USD0", "FRAX", "GHO", "CRVUSD", "USDTB", "MSUSD", "AUSD"];
const SEVEN_DAYS_BLOCKS = 50_400n; // 7 days at 12 s

export async function referenceRates(assetSymbol: string): Promise<ReferenceRate[]> {
  const c = createPublicClient({ transport: http(PROXY_URL, { timeout: 60_000, retryCount: 3 }) });
  const out: ReferenceRate[] = [{
    name: "holding the asset idle", apy: 0,
    source: "no yield, no lending risk",
    note: "not used for the implied probability: against holding idle, the spread-implied probability essentially equals the break-even",
  }];
  const sym = assetSymbol.toUpperCase();
  try {
    if (USD.includes(sym)) {
      const ssr = await c.readContract({ address: SUSDS, abi: parseAbi(["function ssr() view returns (uint256)"]), functionName: "ssr", blockNumber: SOURCE.block });
      out.push({
        name: "Sky Savings Rate (sUSDS)", apy: Math.exp(Math.log(Number(ssr) / 1e27) * 31_536_000) - 1,
        source: `ssr() of sUSDS ${SUSDS} at block ${SOURCE.block}`,
        note: "on-chain USD savings rate set by Sky governance; not a sovereign risk-free rate (USDS has its own risks)",
      });
    } else if (sym === "WETH" || sym === "ETH") {
      const abi = parseAbi(["function stEthPerToken() view returns (uint256)"]);
      const from = SOURCE.block - SEVEN_DAYS_BLOCKS;
      const [now, then] = await Promise.all([
        c.readContract({ address: WSTETH, abi, functionName: "stEthPerToken", blockNumber: SOURCE.block }),
        c.readContract({ address: WSTETH, abi, functionName: "stEthPerToken", blockNumber: from }),
      ]);
      const [b0, b1] = await Promise.all([c.getBlock({ blockNumber: from }), c.getBlock({ blockNumber: SOURCE.block })]);
      const secs = Number(b1.timestamp - b0.timestamp);
      out.push({
        name: "ETH staking yield (Lido, 7 days)", apy: (Number(now) / Number(then) - 1) * (31_536_000 / secs),
        source: `stEthPerToken() of wstETH at blocks ${from} and ${SOURCE.block} (${(secs / 86400).toFixed(2)} days)`,
        note: "the usual ETH benchmark yield; not risk-free (Lido smart-contract and slashing risk)",
      });
    }
  } catch (e) {
    out.push({ name: "on-chain reference unavailable", apy: NaN, source: String((e as Error).message).split("\n")[0].slice(0, 120), note: "the read failed (offline and not cached?)" });
  }
  return out;
}
