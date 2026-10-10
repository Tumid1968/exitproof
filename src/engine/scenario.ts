/**
 * Declarative scenarios executed on the fork. A scenario is an ordered list of actions replayed from
 * the pristine source snapshot; each transaction k is mined at T0 + 12k. Every action is either a
 * real contract call by an impersonated actor (scenario hypothesis) or an explicit state override
 * (oracle replaced by a constant: shock hypothesis). Measurements are eth_calls on the fork.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { decodeEventLog, encodeAbiParameters, encodeFunctionData, getAddress, keccak256, pad, toHex, type Address, type Hex } from "viem";
import { rpc } from "../lib/rpc.ts";
import { erc20Abi, metaMorphoAbi, morphoBlueAbi, morphoOracleAbi, publicAllocatorAbi } from "../lib/abis.ts";
import { ADDR, PROXY_URL, SOURCE } from "../lib/constants.ts";
import { ForkEngine, type Action as ExitAction, type StepResult } from "./fork.ts";
import type { DecodedError } from "./decode.ts";

export type ScenarioAction =
  | { type: "exit"; label?: string; vault: Address; owner: Address; action: ExitAction }
  /** Replace the oracle's code with a constant returning price() = original * num / den. */
  | { type: "oraclePrice"; label?: string; oracle: Address; num: string; den: string }
  /** Liquidate every listed borrower that is unhealthy at the current oracle price (seize all collateral, or repay all debt). */
  | { type: "liquidateAll"; label?: string; marketId: Hex; borrowers: Address[] }
  | { type: "measure"; label: string }
  /**
   * Anyone calls the Public Allocator to move a PEER vault's funds from its markets outside the target's
   * exposure into one of the target's markets (amounts computed live on the fork within flow caps, supply
   * cap headroom and market liquidity). Mitigation: it adds idle liquidity where the holder withdraws.
   */
  | { type: "publicReallocate"; label?: string; vault: Address; supplyMarketId: Hex; excludeMarketIds: Hex[] };

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
  /** V1.1 only: totalAssets minus the real assets (sum of market positions), i.e. bad debt not reflected in the share price. 0 on V1.0. */
  vaultLostAssets: string;
  holderEconomicValue: string;
  holderMaxWithdraw: string;
  markets: { id: Hex; totalSupplyAssets: string; totalBorrowAssets: string; liquidity: string; vaultSupplyAssets: string }[];
};

export type LiquidationResult = { borrower: Address; mode: "seizeAll" | "repayAll"; ok: boolean; repaidAssets: string; badDebtRealised: string; error: DecodedError | null };

export type ActionResult =
  | { type: "exit"; label?: string; result: StepResult }
  | { type: "oraclePrice"; label?: string; oracle: Address; priceBefore: string; priceAfter: string; error?: string }
  | { type: "liquidateAll"; label?: string; marketId: Hex; attempted: number; liquidated: number; repaidAssets: string; badDebtRealised: string; liquidations: LiquidationResult[]; error?: string }
  | { type: "measure"; label: string; m: Measurement }
  | { type: "publicReallocate"; label?: string; vault: Address; supplyMarketId: Hex; withdrawals: { marketId: Hex; amount: string }[]; moved: string; feeWei: string; ok: boolean; error: DecodedError | null };

export type ScenarioResult = { id: string; title: string; hypotheses: string[]; target: Scenario["target"]; txCount: number; results: ActionResult[] };

/** A fixed liquidator address (no private key needed: impersonated on the local fork). */
export const LIQUIDATOR = getAddress("0x000000000000000000000000000000000000e1f0");
const hex = (n: bigint) => "0x" + n.toString(16);
const oneLine = (e: unknown) => String((e as Error)?.message ?? e).split("\n")[0].slice(0, 200);
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
    const supply = await this.eng.call<bigint>(vault, metaMorphoAbi, "totalSupply");
    const value = await this.eng.call<bigint>(vault, metaMorphoAbi, "convertToAssets", [shares]);
    // MetaMorpho V1.1 (has lostAssets()) keeps the share price up after bad debt: its real assets are the sum of
    // its positions in the markets. V1.0 lowers totalAssets itself, so its convertToAssets is already economic.
    const isV11 = await this.eng.call<bigint>(vault, metaMorphoAbi, "lostAssets").then(() => true, () => false);
    const realTotal = markets.reduce((s, m) => s + BigInt(m.vaultSupplyAssets), 0n);
    const totalAssets = await this.eng.call<bigint>(vault, metaMorphoAbi, "totalAssets");
    const lost = isV11 && totalAssets > realTotal ? totalAssets - realTotal : 0n;
    return {
      label, afterTx: this.k,
      vaultTotalAssets: (await this.eng.call<bigint>(vault, metaMorphoAbi, "totalAssets")).toString(),
      vaultTotalSupply: supply.toString(),
      holderShares: shares.toString(),
      holderValue: value.toString(),
      vaultLostAssets: lost.toString(),
      holderEconomicValue: (supply === 0n ? value : value - (lost * shares) / supply).toString(),
      holderMaxWithdraw: (await this.eng.call<bigint>(vault, metaMorphoAbi, "maxWithdraw", [holder])).toString(),
      markets,
    };
  }

  /**
   * Hardhat 3 (EDR) does not reliably undo hardhat_setCode on evm_revert for forked accounts, so every
   * overridden contract gets its original bytecode back explicitly, read from the archive (via the proxy)
   * at the source block, before and after each scenario.
   */
  private static originals = new Map<string, Hex>();
  private async restoreCode(addr: Address) {
    const k = getAddress(addr);
    if (!ScenarioRunner.originals.has(k))
      ScenarioRunner.originals.set(k, await rpc<Hex>(PROXY_URL, "eth_getCode", [k, "0x" + SOURCE.block.toString(16)]));
    await rpc(this.eng.url, "hardhat_setCode", [k, ScenarioRunner.originals.get(k)!]);
  }
  /** Every address whose code was ever replaced on this fork, persisted so another process can restore it. */
  private static OVERRIDES_FILE = "cache/fork-code-overrides.json";
  private static recorded(): string[] {
    try { return JSON.parse(readFileSync(ScenarioRunner.OVERRIDES_FILE, "utf8")); } catch { return []; }
  }
  private static record(addr: Address) {
    const all = new Set(ScenarioRunner.recorded());
    all.add(getAddress(addr));
    mkdirSync("cache", { recursive: true });
    writeFileSync(ScenarioRunner.OVERRIDES_FILE, JSON.stringify([...all].sort()));
  }
  private async restoreAll() {
    const all = new Set([...ScenarioRunner.originals.keys(), ...ScenarioRunner.recorded()]);
    for (const k of all) await this.restoreCode(k as Address);
  }

  private async setOracle(a: Extract<ScenarioAction, { type: "oraclePrice" }>): Promise<ActionResult> {
    await this.restoreCode(a.oracle);
    let before: bigint;
    try { before = await this.eng.call<bigint>(a.oracle, morphoOracleAbi, "price"); }
    catch (e) {
      // An oracle whose price() reverts freezes its market (no borrow, no liquidation): recorded, not overridden.
      return { type: "oraclePrice", label: a.label, oracle: a.oracle, priceBefore: "0", priceAfter: "0", error: "oracle price() reverts at the source block: " + oneLine(e) };
    }
    // Guard: the price we shock must be the real one at the source block.
    const ref = await rpc<Hex>(PROXY_URL, "eth_call", [{ to: a.oracle, data: "0xa035b1fe" }, "0x" + SOURCE.block.toString(16)]);
    if (BigInt(ref) !== before) throw new Error(`oracle ${a.oracle} price on fork (${before}) differs from archive (${BigInt(ref)})`);
    const after = (before * BigInt(a.num)) / BigInt(a.den);
    ScenarioRunner.record(a.oracle); // before the override: a crash after it still gets restored next time
    await rpc(this.eng.url, "hardhat_setCode", [a.oracle, constantReturner(after)]);
    return { type: "oraclePrice", label: a.label, oracle: a.oracle, priceBefore: before.toString(), priceAfter: after.toString() };
  }

  private funded = new Set<string>();
  /**
   * Give the liquidator loan tokens (scenario hypothesis: liquidators have capital).
   * WETH: wrap impersonated ETH. Other ERC-20: locate the balanceOf mapping slot by probing
   * (Solidity and Vyper layouts) and write the balance with hardhat_setStorageAt.
   */
  private async fundLiquidator(token: Address) {
    const key = token.toLowerCase();
    if (this.funded.has(key)) return;
    await rpc(this.eng.url, "hardhat_impersonateAccount", [LIQUIDATOR]);
    await rpc(this.eng.url, "hardhat_setBalance", [LIQUIDATOR, hex(10n ** 6n * 10n ** 18n)]);
    if (key === ADDR.weth.toLowerCase()) {
      await this.tx(LIQUIDATOR, ADDR.weth, encodeFunctionData({ abi: erc20Abi, functionName: "deposit" }), 500_000n * 10n ** 18n);
    } else {
      const amount = 10n ** 30n;
      let ok = false;
      for (let slot = 0n; slot < 64n && !ok; slot++) {
        for (const layout of ["sol", "vy"] as const) {
          const k = layout === "sol"
            ? keccak256(encodeAbiParameters([{ type: "address" }, { type: "uint256" }], [LIQUIDATOR, slot]))
            : keccak256(encodeAbiParameters([{ type: "uint256" }, { type: "address" }], [slot, LIQUIDATOR]));
          const prev = await rpc<Hex>(this.eng.url, "eth_getStorageAt", [token, k, "latest"]);
          await rpc(this.eng.url, "hardhat_setStorageAt", [token, k, pad(toHex(amount))]);
          if ((await this.eng.call<bigint>(token, erc20Abi, "balanceOf", [LIQUIDATOR])) === amount) { ok = true; break; }
          await rpc(this.eng.url, "hardhat_setStorageAt", [token, k, pad(prev)]);
        }
      }
      if (!ok) throw new Error(`cannot fund liquidator with ${token}: balance slot not found`);
    }
    await this.tx(LIQUIDATOR, token, encodeFunctionData({ abi: erc20Abi, functionName: "approve", args: [ADDR.morphoBlue, MAX] }));
    this.funded.add(key);
  }

  private async liquidateAll(a: Extract<ScenarioAction, { type: "liquidateAll" }>): Promise<ActionResult> {
    const p = await this.eng.call<readonly [Address, Address, Address, Address, bigint]>(ADDR.morphoBlue, morphoBlueAbi, "idToMarketParams", [a.marketId]);
    const params = { loanToken: p[0], collateralToken: p[1], oracle: p[2], irm: p[3], lltv: p[4] };
    await this.fundLiquidator(params.loanToken);
    // Accrue interest first so health checks use up-to-date debt.
    await this.tx(LIQUIDATOR, ADDR.morphoBlue, encodeFunctionData({ abi: morphoBlueAbi, functionName: "accrueInterest", args: [params] }));
    let price: bigint;
    try { price = await this.eng.call<bigint>(params.oracle, morphoOracleAbi, "price"); }
    catch (e) {
      return { type: "liquidateAll", label: a.label, marketId: a.marketId, attempted: 0, liquidated: 0, repaidAssets: "0", badDebtRealised: "0", liquidations: [], error: "oracle price() reverts: no position can be liquidated (" + oneLine(e) + ")" };
    }
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

  private async publicReallocate(a: Extract<ScenarioAction, { type: "publicReallocate" }>): Promise<ActionResult> {
    const PA = getAddress("0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D");
    const params = async (id: Hex) => {
      const p = await this.eng.call<readonly [Address, Address, Address, Address, bigint]>(ADDR.morphoBlue, morphoBlueAbi, "idToMarketParams", [id]);
      return { loanToken: p[0], collateralToken: p[1], oracle: p[2], irm: p[3], lltv: p[4] };
    };
    const caller = getAddress("0x000000000000000000000000000000000000a110");
    await rpc(this.eng.url, "hardhat_impersonateAccount", [caller]);
    await rpc(this.eng.url, "hardhat_setBalance", [caller, hex(10n ** 18n * 10n)]);
    // reallocateTo accrues interest before MetaMorpho checks the supply cap: accrue first so the room we compute is exact
    await this.tx(caller, ADDR.morphoBlue, encodeFunctionData({ abi: morphoBlueAbi, functionName: "accrueInterest", args: [await params(a.supplyMarketId)] }));
    const [maxIn] = await this.eng.call<readonly [bigint, bigint]>(PA, publicAllocatorAbi, "flowCaps", [a.vault, a.supplyMarketId]);
    const [cap] = await this.eng.call<readonly [bigint, boolean, bigint]>(a.vault, metaMorphoAbi, "config", [a.supplyMarketId]);
    const mS = await this.eng.call<readonly bigint[]>(ADDR.morphoBlue, morphoBlueAbi, "market", [a.supplyMarketId]);
    const pS = await this.eng.call<readonly bigint[]>(ADDR.morphoBlue, morphoBlueAbi, "position", [a.supplyMarketId, a.vault]);
    const curS = mS[1] === 0n ? 0n : (pS[0] * (mS[0] + 1n)) / (mS[1] + 1_000_000n);
    let room = cap > curS ? cap - curS : 0n;
    if (maxIn < room) room = maxIn;
    const n = await this.eng.call<bigint>(a.vault, metaMorphoAbi, "withdrawQueueLength");
    const ws: { marketId: Hex; amount: bigint }[] = [];
    for (let i = 0n; i < n && room > 0n; i++) {
      const id = await this.eng.call<Hex>(a.vault, metaMorphoAbi, "withdrawQueue", [i]);
      if (id === a.supplyMarketId || a.excludeMarketIds.includes(id)) continue;
      const [, maxOut] = await this.eng.call<readonly [bigint, bigint]>(PA, publicAllocatorAbi, "flowCaps", [a.vault, id]);
      if (maxOut === 0n) continue;
      const m = await this.eng.call<readonly bigint[]>(ADDR.morphoBlue, morphoBlueAbi, "market", [id]);
      const p = await this.eng.call<readonly bigint[]>(ADDR.morphoBlue, morphoBlueAbi, "position", [id, a.vault]);
      const sup = m[1] === 0n ? 0n : (p[0] * m[0]) / (m[1] + 1_000_000n); // round down, below the vault's balance
      let amt = [maxOut, sup, m[0] - m[2], room].reduce((x, y) => (x < y ? x : y));
      amt = (amt * 999n) / 1000n; // margin for interest accrued between this read and the tx
      if (amt <= 0n) continue;
      ws.push({ marketId: id, amount: amt });
      room -= amt;
    }
    const fee = await this.eng.call<bigint>(PA, publicAllocatorAbi, "fee", [a.vault]);
    if (!ws.length) return { type: "publicReallocate", label: a.label, vault: a.vault, supplyMarketId: a.supplyMarketId, withdrawals: [], moved: "0", feeWei: fee.toString(), ok: true, error: null };
    ws.sort((x, y) => (BigInt(x.marketId) < BigInt(y.marketId) ? -1 : 1)); // the Public Allocator requires increasing ids
    const withdrawals = [] as { marketParams: Awaited<ReturnType<typeof params>>; amount: bigint }[];
    for (const w of ws) withdrawals.push({ marketParams: await params(w.marketId), amount: w.amount });
    const data = encodeFunctionData({ abi: publicAllocatorAbi, functionName: "reallocateTo", args: [a.vault, withdrawals, await params(a.supplyMarketId)] });
    const r = await this.tx(caller, PA, data, fee);
    return {
      type: "publicReallocate", label: a.label, vault: a.vault, supplyMarketId: a.supplyMarketId,
      withdrawals: ws.map((w) => ({ marketId: w.marketId, amount: w.amount.toString() })),
      moved: (r.ok ? ws.reduce((t, w) => t + w.amount, 0n) : 0n).toString(), feeWei: fee.toString(), ok: r.ok, error: r.error,
    };
  }

  async run(s: Scenario): Promise<ScenarioResult> {
    await this.eng.reset();
    for (const a of s.actions) if (a.type === "oraclePrice") await this.restoreCode(a.oracle);
    await this.restoreAll();
    this.k = 0;
    this.funded.clear();
    const results: ActionResult[] = [];
    try {
    for (const a of s.actions) {
      if (a.type === "exit") {
        this.k++;
        results.push({ type: "exit", label: a.label, result: await this.eng.runStep({ label: a.label, vault: a.vault, owner: a.owner, action: a.action }, this.k) });
      } else if (a.type === "oraclePrice") results.push(await this.setOracle(a));
      else if (a.type === "liquidateAll") results.push(await this.liquidateAll(a));
      else if (a.type === "publicReallocate") results.push(await this.publicReallocate(a));
      else results.push({ type: "measure", label: a.label, m: await this.measure(a.label, s.target) });
    }
    } finally {
      // never leave a shocked oracle on the shared fork, even if an action failed
      await this.restoreAll();
    }
    return { id: s.id, title: s.title, hypotheses: s.hypotheses, target: s.target, txCount: this.k, results };
  }
}
