/**
 * Provenance-tracking on-chain reader. Every value used in the dependency graph comes from a
 * recorded read: method, contract, function, arguments, block, raw result. A link without a read
 * behind it is not allowed in the graph.
 */
import { createPublicClient, http, toFunctionSelector, type Abi, type AbiFunction, type Address, type Hex } from "viem";
import { ADDR, PROXY_URL, SOURCE } from "../lib/constants.ts";

export type ReadRecord = {
  id: string;
  method: "eth_call" | "eth_getStorageAt" | "eth_getCode" | "eth_getBlockByNumber" | "offchain-candidates";
  to?: Address;
  fn?: string;
  args?: unknown[];
  block: string;
  ok: boolean;
  result: unknown;
};

const json = (v: unknown): unknown =>
  typeof v === "bigint" ? v.toString()
  : Array.isArray(v) ? v.map(json)
  : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, json(x)]))
  : v;

export class Reader {
  readonly client = createPublicClient({ transport: http(PROXY_URL, { timeout: 60_000, retryCount: 4 }) });
  readonly reads: ReadRecord[] = [];
  readonly block = SOURCE.block;
  private n = 0;

  private record(r: Omit<ReadRecord, "id" | "block">): string {
    const id = `r${++this.n}`;
    this.reads.push({ id, block: this.block.toString(), ...r, result: json(r.result) });
    return id;
  }

  /** eth_call at the frozen block. Returns [value, readId]; value undefined if the call reverts (probe). */
  async call<T>(to: Address, abi: Abi, fn: string, args: unknown[] = []): Promise<[T | undefined, string]> {
    const item = abi.find((x) => x.type === "function" && x.name === fn) as AbiFunction;
    const sig = `${fn}(${item.inputs.map((i) => i.type).join(",")})`;
    try {
      const v = (await this.client.readContract({ address: to, abi, functionName: fn, args, blockNumber: this.block } as never)) as T;
      return [v, this.record({ method: "eth_call", to, fn: sig, args: json(args) as unknown[], ok: true, result: v })];
    } catch (e) {
      const msg = (e as Error).message.split("\n")[0];
      // Transport / cache-miss problems must never be silently recorded as "function absent".
      const full = `${(e as Error).message} ${(e as { details?: string }).details ?? ""}`;
      if (/upstream failed|offline proxy|fetch failed|ECONNREFUSED|took too long/i.test(full)) throw e;
      return [undefined, this.record({ method: "eth_call", to, fn: sig, args: json(args) as unknown[], ok: false, result: `revert/absent: ${msg.slice(0, 120)}` })];
    }
  }

  async must<T>(to: Address, abi: Abi, fn: string, args: unknown[] = []): Promise<[T, string]> {
    const [v, id] = await this.call<T>(to, abi, fn, args);
    if (v === undefined) throw new Error(`required read failed: ${fn} on ${to}`);
    return [v, id];
  }

  /**
   * Many eth_calls of the same function batched through Multicall3 (aggregate3, failures allowed).
   * One record per batch, listing every (to, args) so each value stays auditable.
   */
  async multi<T>(abi: Abi, fn: string, calls: { to: Address; args: unknown[] }[], batch = 150): Promise<[(T | undefined)[], string[]]> {
    const item = abi.find((x) => x.type === "function" && x.name === fn) as AbiFunction;
    const sig = `${fn}(${item.inputs.map((i) => i.type).join(",")})`;
    const values: (T | undefined)[] = [];
    const ids: string[] = [];
    for (let s = 0; s < calls.length; s += batch) {
      const part = calls.slice(s, s + batch);
      const res = await this.client.multicall({
        contracts: part.map((c) => ({ address: c.to, abi, functionName: fn, args: c.args })) as never,
        blockNumber: this.block,
        allowFailure: true,
        multicallAddress: ADDR.multicall3,
        batchSize: 0,
      });
      const vals = (res as { status: string; result?: unknown }[]).map((x) => (x.status === "success" ? (x.result as T) : undefined));
      values.push(...vals);
      const id = this.record({
        method: "eth_call",
        to: ADDR.multicall3,
        fn: `aggregate3 x${part.length} ${sig}`,
        args: part.map((c) => ({ to: c.to, args: json(c.args) })),
        ok: true,
        result: vals.map(json),
      });
      for (let k = 0; k < part.length; k++) ids.push(id);
    }
    return [values, ids];
  }

  async storage(to: Address, slot: Hex): Promise<[Hex, string]> {
    const v = (await this.client.getStorageAt({ address: to, slot, blockNumber: this.block })) ?? "0x";
    return [v, this.record({ method: "eth_getStorageAt", to, args: [slot], ok: true, result: v })];
  }

  async codeSize(to: Address): Promise<[number, string, Hex]> {
    const code = (await this.client.getCode({ address: to, blockNumber: this.block })) ?? "0x";
    const size = (code.length - 2) / 2;
    // Keep the code hash-free and short in the record: size + 4-byte prefix are enough to audit
    return [size, this.record({ method: "eth_getCode", to, ok: true, result: { size, prefix: code.slice(0, 10) } }), code];
  }

  async blockHeader() {
    const b = await this.client.getBlock({ blockNumber: this.block });
    return [b, this.record({ method: "eth_getBlockByNumber", ok: true, result: { number: b.number, hash: b.hash, timestamp: b.timestamp, baseFeePerGas: b.baseFeePerGas } })] as const;
  }

  /** Off-chain candidate list (Morpho API). Recorded so the UI can show which links rest on it. */
  offchain(rec: { source: string; query: string; fetchedAt: string; resultCount: number }): string {
    return this.record({ method: "offchain-candidates", fn: rec.source, args: [rec.query], ok: true, result: { fetchedAt: rec.fetchedAt, resultCount: rec.resultCount } });
  }
}

export const selectorOf = (sig: string) => toFunctionSelector(sig);
