/**
 * Execution engine on the local Hardhat fork (frozen source block).
 *
 * Every branch starts from the same snapshot of the source state. Transaction k (1-based) of a
 * branch is mined at T0 + 12*k so interest accrual, hence every amount, is identical run to run.
 * Actors are impersonated: this is a scenario hypothesis, not their signature or intention.
 */
import { encodeFunctionData, decodeFunctionResult, type Address, type Hex, type Abi } from "viem";
import { rpc, rpcRaw, revertData } from "../lib/rpc.ts";
import { erc20Abi, metaMorphoAbi } from "../lib/abis.ts";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { NODE_URL, SOURCE, TIMESTAMP_STEP } from "../lib/constants.ts";
import { decodeRevert, type DecodedError } from "./decode.ts";

export type Action =
  | { kind: "redeemAll" }
  | { kind: "redeemShares"; shares: string }
  | { kind: "withdrawAssets"; assets: string }
  | { kind: "withdrawMax" };

export type Step = { label?: string; vault: Address; owner: Address; action: Action };

export type StepResult = {
  k: number;
  label?: string;
  vault: Address;
  owner: Address;
  action: Action;
  timestamp: string;
  call: string;
  sharesIn: string;
  assetsRequested?: string;
  ok: boolean;
  assetsOutWei: string;
  error: DecodedError | null;
  gasUsed: string | null;
  /** maxWithdraw(owner) on this vault, eth_call just before the tx (state after step k-1). */
  ownerMaxWithdrawBeforeWei: string;
};

export type BranchResult = { id: string; steps: StepResult[] };

const hex = (n: bigint) => "0x" + n.toString(16);
const SNAP_FILE = "cache/fork-base-snapshot.json";
export type TxLog = { address: Address; topics: Hex[]; data: Hex };

export class ForkEngine {
  private baseSnapshot: string | null = null;
  private instanceId = "";
  constructor(readonly url: string = NODE_URL) {}

  async init() {
    const chainId = BigInt(await rpc<string>(this.url, "eth_chainId"));
    this.instanceId = (await rpc<{ instanceId: string }>(this.url, "hardhat_metadata")).instanceId;
    if (existsSync(SNAP_FILE)) {
      // A previous session of THIS node may have left blocks or state overrides (setCode/setStorageAt mine no
      // block): always revert to the base snapshot it saved. Snapshot ids of another node instance are ignored.
      const saved = JSON.parse(readFileSync(SNAP_FILE, "utf8")) as { url: string; id: string; instanceId?: string };
      if (saved.url === this.url && saved.instanceId === this.instanceId) await rpcRaw(this.url, "evm_revert", [saved.id]);
    }
    const head = BigInt(await rpc<string>(this.url, "eth_blockNumber"));
    const blk = await rpc<{ hash: Hex; timestamp: Hex }>(this.url, "eth_getBlockByNumber", [hex(SOURCE.block), false]);
    if (head !== SOURCE.block || blk.hash.toLowerCase() !== SOURCE.blockHash || BigInt(blk.timestamp) !== SOURCE.timestamp)
      throw new Error(`Fork is not at the frozen source block (head=${head}, hash=${blk.hash}). Restart the node.`);
    await this.saveSnapshot();
    return { localChainId: Number(chainId), forkBlock: head, blockHash: blk.hash, timestamp: BigInt(blk.timestamp) };
  }

  private async saveSnapshot() {
    this.baseSnapshot = await rpc<string>(this.url, "evm_snapshot");
    mkdirSync("cache", { recursive: true });
    writeFileSync(SNAP_FILE, JSON.stringify({ url: this.url, id: this.baseSnapshot, instanceId: this.instanceId }));
  }

  /** Back to the pristine source state (Hardhat consumes a snapshot on revert, so re-take it). */
  async reset() {
    if (!this.baseSnapshot) throw new Error("init() first");
    const ok = await rpc<boolean>(this.url, "evm_revert", [this.baseSnapshot]);
    if (!ok) throw new Error("evm_revert failed");
    await this.saveSnapshot();
  }

  async call<T>(to: Address, abi: Abi, functionName: string, args: unknown[] = []): Promise<T> {
    const data = encodeFunctionData({ abi, functionName, args } as never);
    const out = await rpc<Hex>(this.url, "eth_call", [{ to, data }, "latest"]);
    return decodeFunctionResult({ abi, functionName, data: out } as never) as T;
  }

  async impersonate(who: Address) {
    await rpc(this.url, "hardhat_impersonateAccount", [who]);
    await rpc(this.url, "hardhat_setBalance", [who, hex(10n * 10n ** 18n)]);
  }

  /** Send a tx from an impersonated account at a pinned timestamp. Reverts come back as JSON-RPC errors. */
  async send(from: Address, to: Address, data: Hex, k: number, value = 0n) {
    const ts = SOURCE.timestamp + TIMESTAMP_STEP * BigInt(k);
    await rpc(this.url, "evm_setNextBlockTimestamp", [hex(ts)]);
    const r = await rpcRaw<Hex>(this.url, "eth_sendTransaction", [
      { from, to, data, gas: hex(6_000_000n), value: hex(value) },
    ]);
    if (r.ok) {
      const rc = await rpc<{ status: Hex; gasUsed: Hex; logs: TxLog[] }>(this.url, "eth_getTransactionReceipt", [r.result]);
      if (rc.status === "0x1") return { ok: true as const, ts, gasUsed: BigInt(rc.gasUsed), error: null, logs: rc.logs };
      return { ok: false as const, ts, gasUsed: BigInt(rc.gasUsed), error: decodeRevert(undefined, "status 0"), logs: [] as TxLog[] };
    }
    return { ok: false as const, ts, gasUsed: null, error: decodeRevert(revertData(r.error), r.error.message), logs: [] as TxLog[] };
  }

  async runStep(step: Step, k: number): Promise<StepResult> {
    const { vault, owner, action } = step;
    const asset = await this.call<Address>(vault, metaMorphoAbi, "asset");
    const shares = await this.call<bigint>(vault, metaMorphoAbi, "balanceOf", [owner]);
    const maxW = await this.call<bigint>(vault, metaMorphoAbi, "maxWithdraw", [owner]);
    const before = await this.call<bigint>(asset, erc20Abi, "balanceOf", [owner]);

    let data: Hex;
    let call: string;
    let sharesIn = 0n;
    let assetsRequested: bigint | undefined;
    switch (action.kind) {
      case "redeemAll":
        sharesIn = shares;
        call = "redeem(all shares)";
        data = encodeFunctionData({ abi: metaMorphoAbi, functionName: "redeem", args: [shares, owner, owner] });
        break;
      case "redeemShares":
        sharesIn = BigInt(action.shares);
        call = "redeem(shares)";
        data = encodeFunctionData({ abi: metaMorphoAbi, functionName: "redeem", args: [sharesIn, owner, owner] });
        break;
      case "withdrawAssets":
        assetsRequested = BigInt(action.assets);
        call = "withdraw(assets)";
        data = encodeFunctionData({ abi: metaMorphoAbi, functionName: "withdraw", args: [assetsRequested, owner, owner] });
        break;
      case "withdrawMax":
        assetsRequested = maxW;
        call = "withdraw(maxWithdraw)";
        data = encodeFunctionData({ abi: metaMorphoAbi, functionName: "withdraw", args: [maxW, owner, owner] });
        break;
    }
    await this.impersonate(owner);
    const sent = await this.send(owner, vault, data, k);
    const after = await this.call<bigint>(asset, erc20Abi, "balanceOf", [owner]);
    if (action.kind !== "redeemAll" && action.kind !== "redeemShares") {
      sharesIn = shares - (await this.call<bigint>(vault, metaMorphoAbi, "balanceOf", [owner]));
    }
    return {
      k, label: step.label, vault, owner, action,
      timestamp: sent.ts.toString(),
      call,
      sharesIn: sharesIn.toString(),
      assetsRequested: assetsRequested?.toString(),
      ok: sent.ok,
      assetsOutWei: (after - before).toString(),
      error: sent.error,
      gasUsed: sent.gasUsed?.toString() ?? null,
      ownerMaxWithdrawBeforeWei: maxW.toString(),
    };
  }

  /** Run an ordered list of exits from the pristine source state. */
  async runBranch(id: string, steps: Step[]): Promise<BranchResult> {
    await this.reset();
    const out: StepResult[] = [];
    for (let i = 0; i < steps.length; i++) out.push(await this.runStep(steps[i], i + 1));
    return { id, steps: out };
  }
}
