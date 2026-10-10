/**
 * Local JSON-RPC proxy on 127.0.0.1:8600.
 *
 * Why: Hardhat's fork cache is keyed by host:port of the fork URL, so we always fork
 * through this fixed address. The proxy also keeps its own on-disk cache of
 * *deterministic* requests (explicit block number, never "latest"), which lets the
 * dependency discovery and the fork run fully offline once warmed.
 *
 *   online  : serve from cache, otherwise forward upstream and cache deterministic answers
 *   offline : serve from cache; answer eth_chainId / eth_blockNumber with constants; refuse the rest
 *
 * Upstream URL comes from EXITPROOF_RPC_URL (never committed), default https://eth.drpc.org.
 */
import http from "node:http";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";

type Mode = "online" | "offline";
type RpcReq = { jsonrpc: "2.0"; id: unknown; method: string; params?: unknown[] };

const mode = (process.argv[2] ?? "online") as Mode;
if (mode !== "online" && mode !== "offline") {
  console.error("usage: rpcProxy.ts online|offline");
  process.exit(2);
}
const PORT = Number(process.env.EXITPROOF_PROXY_PORT ?? 8600);
const UPSTREAM = process.env.EXITPROOF_RPC_URL ?? "https://eth.drpc.org";
const CACHE_DIR = join(process.cwd(), "cache", "proxy");
const META_FILE = join(CACHE_DIR, "meta.json");
const LOG_FILE = join(process.cwd(), "cache", "proxy.log");
mkdirSync(CACHE_DIR, { recursive: true });

// Head reported offline: must be well above the fork block so Hardhat treats the fork block as final.
const FALLBACK_HEAD = 26_200_000;
const meta: { chainId: string; head: string } = existsSync(META_FILE)
  ? JSON.parse(readFileSync(META_FILE, "utf8"))
  : { chainId: "0x1", head: "0x" + FALLBACK_HEAD.toString(16) };

const isBlockNum = (b: unknown) => typeof b === "string" && /^0x[0-9a-fA-F]+$/.test(b);
const isBlockHash = (b: unknown) => typeof b === "string" && /^0x[0-9a-fA-F]{64}$/.test(b);
const isBlockRef = (b: unknown) =>
  isBlockNum(b) || isBlockHash(b) ||
  (typeof b === "object" && b !== null && ("blockNumber" in b || "blockHash" in b));

/** A request is cacheable only if its answer can never change (pinned block). */
function cacheable(r: RpcReq): boolean {
  const p = r.params ?? [];
  switch (r.method) {
    case "eth_chainId":
    case "net_version":
      return true;
    case "eth_call":
    case "eth_getBalance":
    case "eth_getCode":
    case "eth_getTransactionCount":
      return isBlockRef(p[p.length - 1]);
    case "eth_getStorageAt":
      return isBlockRef(p[2]);
    case "eth_getBlockByNumber":
      return isBlockNum(p[0]);
    case "eth_getBlockByHash":
    case "eth_getTransactionByHash":
    case "eth_getTransactionReceipt":
      return true;
    case "eth_getLogs": {
      const f = (p[0] ?? {}) as Record<string, unknown>;
      return (isBlockNum(f.fromBlock) && isBlockNum(f.toBlock)) || isBlockHash(f.blockHash);
    }
    default:
      return false;
  }
}

const keyOf = (r: RpcReq) =>
  createHash("sha256").update(r.method + JSON.stringify(r.params ?? [])).digest("hex");

type Answer = { result?: unknown; error?: unknown };
function readCache(r: RpcReq): Answer | undefined {
  const k = keyOf(r);
  const f = join(CACHE_DIR, k.slice(0, 2), k + ".json");
  if (!existsSync(f)) return undefined;
  const j = JSON.parse(readFileSync(f, "utf8"));
  return "error" in j ? { error: j.error } : { result: j.result };
}
function writeCache(r: RpcReq, ans: Answer) {
  const k = keyOf(r);
  mkdirSync(join(CACHE_DIR, k.slice(0, 2)), { recursive: true });
  writeFileSync(join(CACHE_DIR, k.slice(0, 2), k + ".json"), JSON.stringify({ method: r.method, params: r.params, ...ans }));
}
/** An eth_call revert at a pinned block is as deterministic as a result: cache it too. */
const isExecutionRevert = (r: RpcReq, e: unknown) =>
  r.method === "eth_call" && typeof e === "object" && e !== null &&
  ((e as { code?: number }).code === 3 || /revert/i.test(String((e as { message?: string }).message)));

const stats = { hit: 0, forwarded: 0, refused: 0, upstreamErr: 0 };
const log = (s: string) => appendFileSync(LOG_FILE, `${new Date().toISOString()} ${mode} ${s}\n`);

// Concurrency limiter + retry: free public RPCs rate-limit aggressively.
let inFlight = 0;
const waiting: (() => void)[] = [];
const MAX_IN_FLIGHT = Number(process.env.EXITPROOF_PROXY_CONCURRENCY ?? 8);
async function withSlot<T>(fn: () => Promise<T>): Promise<T> {
  while (inFlight >= MAX_IN_FLIGHT) await new Promise<void>((res) => waiting.push(res));
  inFlight++;
  try { return await fn(); } finally { inFlight--; waiting.shift()?.(); }
}

async function forward(r: RpcReq): Promise<{ result?: unknown; error?: unknown }> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 7; attempt++) {
    try {
      const res = await withSlot(() => fetch(UPSTREAM, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: r.method, params: r.params ?? [] }),
      }));
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      const j = (await res.json()) as { result?: unknown; error?: { code?: number; message?: string } };
      // Execution reverts are legitimate deterministic answers; rate-limit style errors are retried.
      if (j.error && /limit|too many|timeout|temporar|busy|unavailable|internal/i.test(j.error.message ?? ""))
        throw new Error(j.error.message);
      return j;
    } catch (e) {
      lastErr = e;
      await new Promise((res) => setTimeout(res, 300 * 2 ** attempt));
    }
  }
  stats.upstreamErr++;
  log(`UPSTREAM_FAIL ${r.method} ${String(lastErr)}`);
  return { error: { code: -32603, message: `upstream failed: ${String(lastErr)}` } };
}

async function handle(r: RpcReq): Promise<Record<string, unknown>> {
  const base = { jsonrpc: "2.0", id: r.id };
  if (r.method === "eth_chainId" && mode === "offline") return { ...base, result: meta.chainId };
  if (r.method === "eth_blockNumber" && mode === "offline") return { ...base, result: meta.head };

  if (cacheable(r)) {
    const hit = readCache(r);
    if (hit !== undefined) { stats.hit++; return { ...base, ...hit }; }
  }
  if (mode === "offline") {
    stats.refused++;
    log(`REFUSED ${r.method} ${JSON.stringify(r.params).slice(0, 300)}`);
    return { ...base, error: { code: -32000, message: `exitproof offline proxy: ${r.method} not in cache` } };
  }
  stats.forwarded++;
  const ans = await forward(r);
  if (cacheable(r) && (ans.error === undefined || isExecutionRevert(r, ans.error)))
    writeCache(r, ans.error === undefined ? { result: ans.result } : { error: ans.error });
  if (r.method === "eth_blockNumber" && typeof ans.result === "string") {
    meta.head = ans.result;
    writeFileSync(META_FILE, JSON.stringify(meta));
  }
  return { ...base, ...(ans.error !== undefined ? { error: ans.error } : { result: ans.result }) };
}

const server = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    try {
      const parsed = JSON.parse(body);
      const out = Array.isArray(parsed) ? await Promise.all(parsed.map(handle)) : await handle(parsed);
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(400);
      res.end(JSON.stringify({ jsonrpc: "2.0", id: null, error: { code: -32700, message: String(e) } }));
    }
  });
});
server.listen(PORT, "127.0.0.1", () => {
  const shown = mode === "online" ? new URL(UPSTREAM).host : "none (cache only)";
  console.log(`[exitproof-proxy] ${mode} on http://127.0.0.1:${PORT} upstream=${shown}`);
});
setInterval(() => {
  if (stats.forwarded + stats.refused + stats.hit > 0)
    console.log(`[exitproof-proxy] hit=${stats.hit} fwd=${stats.forwarded} refused=${stats.refused} upErr=${stats.upstreamErr}`);
}, 15_000).unref();
