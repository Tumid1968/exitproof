export const api = async <T,>(path: string, body?: unknown): Promise<T> => {
  const r = await fetch(path, body === undefined ? undefined : { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? r.statusText);
  return j as T;
};

/** wei string/bigint -> "1,234.56" (native units, never USD) */
export const w = (x: string | bigint | null | undefined, dp = 2, decimals = 18) => {
  if (x === null || x === undefined) return "—";
  const v = Number(BigInt(x)) / 10 ** decimals;
  return v.toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp });
};
export const pct = (x: number | null | undefined, dp = 1) =>
  x === null || x === undefined ? "—" : (x * 100).toLocaleString("en-US", { minimumFractionDigits: dp, maximumFractionDigits: dp }) + "%";
export const short = (a: string) => a.slice(0, 6) + "…" + a.slice(-4);
export const etherscan = (a: string) => `https://etherscan.io/address/${a}`;

export type Kind = "onchain" | "fork" | "hyp" | "offchain";
export const KIND_LABEL: Record<Kind, string> = {
  onchain: "read on-chain",
  fork: "executed on local fork",
  hyp: "hypothesis",
  offchain: "off-chain candidate list",
};

// Loose types for the JSON produced by the engine (see src/report/build.ts, src/discovery/types.ts)
export type Report = any; // eslint-disable-line @typescript-eslint/no-explicit-any
export type Graph = any; // eslint-disable-line @typescript-eslint/no-explicit-any
