/** Minimal raw JSON-RPC client: we need the untouched `error.data` of reverts, so no wrapper magic. */
export type RpcError = { code: number; message: string; data?: unknown };
export type RpcResult<T> = { ok: true; result: T } | { ok: false; error: RpcError };

let nextId = 1;

export async function rpcRaw<T = unknown>(url: string, method: string, params: unknown[] = []): Promise<RpcResult<T>> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  });
  const j = (await res.json()) as { result?: T; error?: RpcError };
  if (j.error) return { ok: false, error: j.error };
  return { ok: true, result: j.result as T };
}

export async function rpc<T = unknown>(url: string, method: string, params: unknown[] = []): Promise<T> {
  const r = await rpcRaw<T>(url, method, params);
  if (!r.ok) throw new Error(`${method} failed: ${r.error.message} ${JSON.stringify(r.error.data ?? "")}`);
  return r.result;
}

/** Extract revert data (0x...) from a JSON-RPC error, whatever the node's nesting. */
export function revertData(err: RpcError): `0x${string}` | undefined {
  const d = err.data as unknown;
  if (typeof d === "string" && d.startsWith("0x")) return d as `0x${string}`;
  if (d && typeof d === "object") {
    const o = d as Record<string, unknown>;
    if (typeof o.data === "string" && o.data.startsWith("0x")) return o.data as `0x${string}`;
    if (typeof o.result === "string" && o.result.startsWith("0x")) return o.result as `0x${string}`;
  }
  const m = /(0x[0-9a-fA-F]{8,})/.exec(err.message);
  return m ? (m[1] as `0x${string}`) : undefined;
}
