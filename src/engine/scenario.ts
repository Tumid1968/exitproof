/**
 * Declarative scenarios executed on the fork. A scenario is an ordered list of actions replayed from
 * the pristine source snapshot; each transaction k is mined at T0 + 12k. Every action is either a
 * real contract call by an impersonated actor (scenario hypothesis) or an explicit state override
 * (oracle replaced by a constant: shock hypothesis). Measurements are eth_calls on the fork.
 */
import { decodeEventLog, encodeFunctionData, getAddress, type Address, type Hex } from "viem";
import { rpc } from "../lib/rpc.ts";
import { erc20Abi, metaMorphoAbi, morphoBlueAbi, morphoOracleAbi } from "../lib/abis.ts";
import { ADDR } from "../lib/constants.ts";
import { ForkEngine, type Action as ExitAction, type StepResult } from "./fork.ts";
import type { DecodedError } from "./decode.ts";

export type ScenarioAction =
  | { type: "exit"; label?: string; vault: Address; owner: Address; action: ExitAction }
  /** Replace the oracle's code with a constant returning price() = original * num / den. */
  | { type: "oraclePrice"; label?: string; oracle: Address; num: string; den: string }
  /** Liquidate every listed borrower that is unhealthy at the current oracle price (seize all collateral, or repay all debt). */
  | { type: "liquidateAll"; label?: string; marketId: Hex; borrowers: Address[] }
  | { type: "measure"; label: string };

export type Scenario = {
  id: string;
  title: string;
  /** what this branch assumes; shown next to every number */
  hypotheses: string[];
  target: { vault: Address; holder: Address };
  actions: ScenarioAction[];
};

export type Measurement = {
  label: string;
  afterTx: number;
  vaultTotalAssets: string;
  vaultTotalSupply: string;
  holderShares: string;
  holderValue: string;
  holderMaxWithdraw: string;
  markets: { id: Hex; totalSupplyAssets: string; totalBorrowAssets: string; liquidity: string; vaultSupplyAssets: string }[];
};

export type LiquidationResult = { borrower: Address; mode: "seizeAll" | "repayAll"; ok: boolean; repaidAssets: string; badDebtRealised: string; error: DecodedError | null };

export type ActionResult =
  | { type: "exit"; label?: string; result: StepResult }
  | { type: "oraclePrice"; label?: string; oracle: Address; priceBefore: string; priceAfter: string }
  | { type: "liquidateAll"; label?: string; marketId: Hex; attempted: number; liquidated: number; repaidAssets: string; badDebtRealised: string; liquidations: LiquidationResult[] }
  | { type: "measure"; label: string; m: Measurement };

export type ScenarioResult = { id: string; title: string; hypotheses: string[]; target: Scenario["target"]; txCount: number; results: ActionResult[] };

/** A fixed liquidator address (no private key needed: impersonated on the local fork). */
export const LIQUIDATOR = "0x000000000000000000000000000000000000E1F0" as Address;
const hex = (n: bigint) => "0x" + n.toString(16);
const MAX = 2n ** 256n - 1n;

/** Runtime bytecode: return the 32-byte constant for any call (Morpho Blue only calls price()). */
const constantReturner = (v: bigint) => ("0x7f" + v.toString(16).padStart(64, "0") + "60005260206000f3") as Hex;

export class ScenarioRunner {
  private k = 0;
  private marketsOfVault = new Map<string, Hex[]>();
  constructor(readonly eng: ForkEngine) {}

  private async tx(from: Address, to: Address, data: Hex, value = 0n) {
    this.k++;
    return this.eng.send(from, to, data, this.k, value);
  }

  private async vaultMarkets(vault: Address): Promise<Hex[]> {
    const key = getAddress(vault);
    if (!this.marketsOfVault.has(key)) {
      const n = await this.eng.call<bigint>(vault, metaMorphoAbi, "withdrawQueueLength");
      const ids: Hex[] = [];
      for (let i = 0n; i < n; i++) ids.push(await this.eng.call<Hex>(vault, metaMorphoAbi, "withdrawQueue", [i]));
      this.marketsOfVault.set(key, ids);
    }
    return this.marketsOfVault.get(key)!;
  }

  async measure(label: string, target: Scenario["target"]): Promise<Measurement> {
    const { vault, holder } = target;
    const shares = await this.eng.call<bigint>(vault, metaMorphoAbi, "balanceOf", [holder]);
    const markets = [];
    for (const id of await this.vaultMarkets(vault)) {
      const m = await this.eng.call<readonly bigint[]>(ADDR.morphoBlue, morphoBlueAbi, "market", [id]);
      const p = await this.eng.call<readonly bigint[]>(ADDR.morphoBlue, morphoBlueAbi, "position", [id, vault]);
      markets.push({
        id, totalSupplyAssets: m[0].toString(), totalBorrowAssets: m[2].toString(), liquidity: (m[0] - m[2]).toString(),
        vaultSupplyAssets: (m[1] === 0n ? 0n : (p[0] * (m[0] + 1n)) / (m[1] + 1_000_000n)).toString(),
      });
    }
    return {
      label, afterTx: this.k,
      vaultTotalAssets: (await this.eng.call<bigint>(vault, metaMorphoAbi, "totalAssets")).toString(),
      vaultTotalSupply: (await this.eng.call<bigint>(vault, metaMorphoAbi, "totalSupply")).toString(),
      holderShares: shares.toString(),
      holderValue: (await this.eng.call<bigint>(vault, metaMorphoAbi, "convertToAssets", [shares])).toString(),
      holderMaxWithdraw: (await this.eng.call<bigint>(vault, metaMorphoAbi, "maxWithdraw", [holder])).toString(),
      markets,
    };
  }

  private async setOracle(a: Extract<ScenarioAction, { type: "oraclePrice" }>): Promise<ActionResult> {
    const before = await this.eng.call<bigint>(a.oracle, morphoOracleAbi, "price");
    const after = (before * BigInt(a.num)) / BigInt(a.den);
    await rpc(this.eng.url, "hardhat_setCode", [a.oracle, constantReturner(after)]);
    return { type: "oraclePrice", label: a.label, oracle: a.oracle, priceBefore: before.toString(), priceAfter: after.toString() };
  }

  private liquidatorReady = false;
  private async fundLiquidator() {
    if (this.liquidatorReady) return;
    await rpc(this.eng.url, "hardhat_impersonateAccount", [LIQUIDATOR]);
    await rpc(this.eng.url, "hardhat_setBalance", [LIQUIDATOR, hex(10n ** 6n * 10n ** 18n)]);
    // Liquidator brings its own WETH (wrapped from impersonated ETH) - scenario hypothesis: liquidators have capital.
    await this.tx(LIQUIDATOR, ADDR.weth, encodeFunctionData({ abi: erc20Abi, functionName: "deposit" }), 500_000n * 10n ** 18n);
    await this.tx(LIQUIDATOR, ADDR.weth, encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [ADDR.morphoBlue, MAX] }));
    this.liquidatorReady = true;
  }

  private async liquidateAll(a: Extract<ScenarioAction, { type: "liquidateAll" }>): Promise<ActionResult> {
    const p = await this.eng.call<readonly [Address, Address, Address, Address, bigint]>(ADDR.morphoBlue, morphoBlueAbi, "idToMarketParams", [a.marketId]);
    const params = { loanToken: p[0], collateralToken: p[1], oracle: p[2], irm: p[3], lltv: p[4] };
    if (params.loanToken.toLowerCase() !== ADDR.weth.toLowerCase()) throw new Error("liquidator funding implemented for WETH-loan markets only");
    await this.fundLiquidator();
    // Accrue interest first so health checks use up-to-date debt.
    await this.tx(LIQUIDATOR, ADDR.morphoBlue, encodeFunctionData({ abi: morphoBlueAbi, functionName: "accrueInterest", args: [params] }));
    const price = await this.eng.call<bigint>(params.oracle, morphoOracleAbi, "price");
    const WAD = 10n ** 18n;
    const lif = (() => { const c = 3n * 10n ** 17n; const l = (WAD * WAD) / ((c * params.lltv) / WAD + WAD - c); return l < 115n * 10n ** 16n ? l : 115n * 10n ** 16n; })();
    const out: LiquidationResult[] = [];
    let repaidTotal = 0n, badTotal = 0n;
    for (const b of a.borrowers) {
      const pos = await this.eng.call<readonly [bigint, bigint, bigint]>(ADDR.morphoBlue, morphoBlueAbi, "position", [a.marketId, b]);
      if (pos[1] === 0n) continue;
      const m = await this.eng.call<readonly bigint[]>(ADDR.morphoBlue, morphoBlueAbi, "market", [a.marketId]);
      const debt = (pos[1] * (m[2] + 1n) + (m[3] + 1_000_000n) - 1n) / (m[3] + 1_000_000n);
      const collValue = (pos[2] * price) / 10n ** 36n;
      if (debt * WAD <= collValue * params.lltv) continue; // healthy at this price
      const seizeAll = (collValue * WAD) / lif < debt;
      const data = encodeFunctionData({
        abi: morphoBlueAbi, functionName: "liquidate",
        args: [params, b, seizeAll ? pos[2] : 0n, seizeAll ? 0n : pos[1], "0x"],
      });
      const r = await this.tx(LIQUIDATOR, ADDR.morphoBlue, data);
      // Amounts from Morpho Blue's own Liquidate event (repaidAssets, badDebtAssets)
      let repaid = 0n, bad = 0n;
      for (const l of r.logs) {
        if (l.address.toLowerCase() !== ADDR.morphoBlue.toLowerCase()) continue;
        try {
          const ev = decodeEventLog({ abi: morphoBlueAbi, data: l.data, topics: l.topics as [Hex, ...Hex[]] });
          if (ev.eventName === "Liquidate") { repaid = ev.args.repaidAssets; bad = ev.args.badDebtAssets; }
        } catch { /* other events */ }
      }
      if (r.ok) { repaidTotal += repaid; badTotal += bad; }
      out.push({ borrower: b, mode: seizeAll ? "seizeAll" : "repayAll", ok: r.ok, repaidAssets: repaid.toString(), badDebtRealised: bad.toString(), error: r.error });
    }
    return {
      type: "liquidateAll", label: a.label, marketId: a.marketId, attempted: out.length, liquidated: out.filter((x) => x.ok).length,
      repaidAssets: repaidTotal.toString(), badDebtRealised: badTotal.toString(), liquidations: out,
    };
  }

  async run(s: Scenario): Promise<ScenarioResult> {
    await this.eng.reset();
    this.k = 0;
    this.liquidatorReady = false;
    const results: ActionResult[] = [];
    for (const a of s.actions) {
      if (a.type === "exit") {
        this.k++;
        results.push({ type: "exit", label: a.label, result: await this.eng.runStep({ label: a.label, vault: a.vault, owner: a.owner, action: a.action }, this.k) });
      } else if (a.type === "oraclePrice") results.push(await this.setOracle(a));
      else if (a.type === "liquidateAll") results.push(await this.liquidateAll(a));
      else results.push({ type: "measure", label: a.label, m: await this.measure(a.label, s.target) });
    }
    return { id: s.id, title: s.title, hypotheses: s.hypotheses, target: s.target, txCount: this.k, results };
  }
}
