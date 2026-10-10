/**
 * Local API for the UI (127.0.0.1:8700). Serves the precomputed report/graphs and runs scenarios
 * live on the fork (one at a time: the fork is a single shared state).
 */
import http from "node:http";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { getAddress, type Address } from "viem";
import { ForkEngine } from "../engine/fork.ts";
import { ScenarioRunner, type Scenario, type ScenarioAction } from "../engine/scenario.ts";
import { loadGraph } from "../discovery/load.ts";
import { FORK_FACT, RUN_HYPOTHESIS, shockActions } from "../scenarios/catalog.ts";
import { ACTORS, NODE_URL, PROXY_URL, SOURCE } from "../lib/constants.ts";
import { rpc, rpcRaw } from "../lib/rpc.ts";
import { toJson } from "../lib/util.ts";
import { buildReport, manifestPath, reportPath } from "../report/build.ts";
import { discover } from "../discovery/discover.ts";

const PORT = Number(process.env.EXITPROOF_API_PORT ?? 8700);

/** Errors meant for the person using the UI: an HTTP status and one readable sentence. */
class UserError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}
type Job = {
  vault: string; state: "running" | "done" | "error"; stage: string; log: string[]; started: string; finished?: string;
  result?: { name: string; nodes: number; reads: number; seconds: number }; error?: { status: number; message: string };
};
const jobs = new Map<string, Job>();

async function runAnalysis(job: Job, holder?: Address) {
  const t0 = Date.now();
  const say = (stage: string) => (s: string) => { job.stage = stage; job.log.push(s); if (job.log.length > 400) job.log.shift(); };
  try {
    await exclusive(async () => {
      say("discovery")("discovering dependencies (on-chain reads at the frozen block)...");
      let g;
      try { g = await discover(job.vault as Address, { log: say("discovery") }); }
      catch (e) { throw friendly(e, "discovery"); }
      mkdirSync("results/discovery", { recursive: true });
      writeFileSync(`results/discovery/${g.target.vault}.json`, toJson(g));
      if (!g.holders.list.length) throw new UserError(422, `${g.target.name}: dependency graph built (${g.nodes.length} nodes) but no holder with shares was found, so there is no position to analyse.`);
      if (BigInt(String(g.summary.totalAssets)) === 0n) throw new UserError(422, `${g.target.name}: the vault holds no assets at block ${SOURCE.block}.`);
      say("scenarios")(`graph: ${g.nodes.length} nodes, ${g.reads.length} reads. Executing scenarios on the fork...`);
      try { await buildReport(g.target.vault, holder, say("scenarios")); }
      catch (e) { throw friendly(e, "scenario execution"); }
      finally { runner = null; } // buildReport moved the fork's base snapshot
      job.result = { name: g.target.name, nodes: g.nodes.length, reads: g.reads.length, seconds: Math.round((Date.now() - t0) / 1000) };
    });
    job.state = "done";
    job.stage = "done";
  } catch (e) {
    const u = e instanceof UserError ? e : friendly(e, job.stage);
    job.state = "error";
    job.error = { status: u.status, message: u.message };
    job.log.push("ERROR " + u.message);
  } finally {
    job.finished = new Date().toISOString();
  }
}

/** Translate engine failures into one actionable sentence (no stack traces in the UI). */
function friendly(e: unknown, stage: string): UserError {
  if (e instanceof UserError) return e;
  const m = `${(e as Error)?.message ?? e} ${(e as { details?: string })?.details ?? ""}`;
  if (/not a MetaMorpho V1/.test(m)) return new UserError(422, m.split("\n")[0].trim());
  if (/offline proxy|not cached|EXITPROOF_OFFLINE/i.test(m)) return new UserError(503, "Offline mode: this vault was never analysed online, so its on-chain state is not in the local cache. Restart the proxy online (npm run proxy) and retry.");
  if (/upstream failed|\b429\b|status(?: code)? 429|Too Many Requests|rate limit|fetch failed|ECONNREFUSED|took too long|timed? ?out/i.test(m)) return new UserError(503, "The archive RPC did not answer (unreachable or rate-limited). Retry in a minute, or set EXITPROOF_RPC_URL to another archive endpoint.");
  if (/Fork is not at the frozen source block|8545/.test(m)) return new UserError(503, "The local fork is not running at the source block. Start it with npm run fork.");
  return new UserError(500, `Failed during ${stage}: ${m.split("\n")[0].trim().slice(0, 250)}`);
}

/** Exits the user can stack before the holder's own exit (real holders at the source block). */
const ACTOR_EXITS: Record<string, { label: string; vault: Address; owner: Address }> = {
  C: { label: "holder #3 exits", vault: ACTORS.steakhouseEth, owner: ACTORS.C },
  D: { label: "holder #4 exits", vault: ACTORS.steakhouseEth, owner: ACTORS.D },
  B: { label: "holder #2 (Safe 3/5) exits", vault: ACTORS.steakhouseEth, owner: ACTORS.B },
  B_G: { label: "holder #2 exits Gauntlet WETH Prime", vault: ACTORS.gauntletWethPrime, owner: ACTORS.B },
  VB1: { label: "Vault Bridge WETH #1 exits its own vault", vault: ACTORS.vaultBridgeWeth, owner: ACTORS.VB1 },
};

let engine: ForkEngine | null = null;
let runner: ScenarioRunner | null = null;
let queue: Promise<unknown> = Promise.resolve();
const exclusive = <T,>(fn: () => Promise<T>): Promise<T> => {
  const p = queue.then(fn, fn);
  queue = p.catch(() => undefined);
  return p;
};
let runnerInstance = "";
async function getRunner() {
  // If the fork was restarted (npm run demo restarts it when it dies), its snapshots are gone: re-init.
  const id = (await rpc<{ instanceId: string }>(NODE_URL, "hardhat_metadata")).instanceId;
  if (!runner || id !== runnerInstance) {
    engine = new ForkEngine();
    await engine.init();
    runner = new ScenarioRunner(engine);
    runnerInstance = id;
  }
  return runner;
}

type ExitSpec = string | { vault: Address; owner: Address; label?: string };
function buildCustom(body: { vault?: Address; holder?: Address; exits?: ExitSpec[]; shock?: { feed: Address; factor: number } }): Scenario {
  const V = getAddress(body.vault ?? ACTORS.steakhouseEth);
  const target = { vault: V, holder: getAddress(body.holder ?? ACTORS.A) };
  const actions: ScenarioAction[] = [{ type: "measure", label: "source state" }];
  const hyps = [FORK_FACT];
  if (body.shock) {
    const g = loadGraph(V);
    if (!g) throw new Error("no discovery graph for this vault");
    const { actions: sa } = shockActions(g, { kind: "feed", feed: body.shock.feed, factor: body.shock.factor, label: "" });
    actions.push(...sa, { type: "measure", label: "after shock and liquidations" });
    hyps.push("Shock hypothesis: oracle replaced on the fork by one returning the shocked price; all unhealthy borrowers liquidated.");
  }
  for (const k of body.exits ?? []) {
    const a = typeof k === "string" ? ACTOR_EXITS[k] : { label: k.label ?? `${k.owner.slice(0, 8)}… exits`, vault: getAddress(k.vault), owner: getAddress(k.owner) };
    if (!a) throw new Error(`unknown actor ${k}`);
    actions.push({ type: "exit", label: a.label, vault: a.vault, owner: a.owner, action: { kind: "redeemAll" } });
  }
  if ((body.exits ?? []).length) hyps.push(RUN_HYPOTHESIS);
  actions.push(
    { type: "measure", label: "before the holder's exit" },
    { type: "exit", label: "holder exits everything (redeem all shares)", vault: V, owner: target.holder, action: { kind: "redeemAll" } },
    { type: "exit", label: "holder withdraws its maximum", vault: V, owner: target.holder, action: { kind: "withdrawMax" } },
    { type: "measure", label: "end" },
  );
  return { id: `custom_${(body.exits ?? []).length}exits${body.shock ? "_shock" : ""}`, title: "Custom run", target, hypotheses: hyps, actions };
}

const json = (res: http.ServerResponse, code: number, body: unknown) => {
  res.writeHead(code, { "content-type": "application/json", "access-control-allow-origin": "*" });
  res.end(typeof body === "string" ? body : toJson(body));
};
const readBody = (req: http.IncomingMessage) => new Promise<string>((r) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => r(b)); });

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  try {
    if (req.method === "OPTIONS") return json(res, 204, "");
    const qv = getAddress(url.searchParams.get("vault") ?? ACTORS.steakhouseEth);
    if (url.pathname === "/api/reports")
      return json(res, 200, existsSync("results/reports") ? readdirSync("results/reports").map((f) => {
        const r = JSON.parse(readFileSync(`results/reports/${f}`, "utf8"));
        return { vault: r.target.vault, name: r.target.name, asset: r.target.assetSymbol, catalog: r.catalog };
      }) : []);
    if (url.pathname === "/api/report") return json(res, 200, readFileSync(reportPath(qv), "utf8"));
    if (url.pathname === "/api/manifest") return json(res, 200, readFileSync(manifestPath(qv), "utf8"));
    if (url.pathname === "/api/replay-last") { const f = manifestPath(qv).replace("manifests", "replays"); return json(res, 200, existsSync(f) ? readFileSync(f, "utf8") : "{}"); }
    if (url.pathname === "/api/vaults")
      return json(res, 200, readdirSync("results/discovery").map((f) => {
        const g = JSON.parse(readFileSync(`results/discovery/${f}`, "utf8"));
        return { vault: g.target.vault, name: g.target.name, version: g.target.version, asset: g.target.assetSymbol, nodes: g.nodes.length, reads: g.reads.length };
      }));
    if (url.pathname.startsWith("/api/graph/")) {
      const v = getAddress(url.pathname.split("/").pop()!);
      return json(res, 200, readFileSync(`results/discovery/${v}.json`, "utf8"));
    }
    if (url.pathname === "/api/status") {
      const proxy = await fetch(PROXY_URL).then((r) => r.json()).catch(() => null);
      const head = await rpcRaw<string>(NODE_URL, "eth_blockNumber").catch(() => null);
      return json(res, 200, { proxy, fork: head && head.ok ? { url: NODE_URL, head: BigInt(head.result).toString(), sourceBlock: SOURCE.block.toString() } : null });
    }
    if (url.pathname === "/api/run" && req.method === "POST") {
      const body = await jsonBody(req);
      const s = buildCustom(body);
      const t0 = Date.now();
      const r = await exclusive(async () => {
        const rn = await getRunner();
        const out = await rn.run(s);
        await engine!.reset();
        return out;
      });
      return json(res, 200, { scenario: s, result: r, ms: Date.now() - t0 });
    }
    if (url.pathname === "/api/analyze" && req.method === "GET") {
      const v = String(url.searchParams.get("vault") ?? "");
      const job = /^0x[0-9a-fA-F]{40}$/.test(v) ? jobs.get(getAddress(v.toLowerCase())) : undefined;
      return job ? json(res, 200, job) : json(res, 404, { error: "No analysis started for this address." });
    }
    if (url.pathname === "/api/analyze" && req.method === "POST") {
      // Any MetaMorpho V1 vault: discovery (on-chain reads) + executed report. Runs as a background job; poll GET.
      const body = await jsonBody(req);
      const raw = String(body.vault ?? "").trim();
      if (!/^0x[0-9a-fA-F]{40}$/.test(raw)) throw new UserError(400, `"${raw.slice(0, 50)}" is not an Ethereum address (0x followed by 40 hex characters).`);
      const v = getAddress(raw.toLowerCase());
      const holderRaw = body.holder ? String(body.holder).trim() : "";
      if (holderRaw && !/^0x[0-9a-fA-F]{40}$/.test(holderRaw)) throw new UserError(400, "holder is not an Ethereum address.");
      const holder = holderRaw ? getAddress(holderRaw.toLowerCase()) : undefined;
      const running = [...jobs.values()].find((j) => j.state === "running");
      if (running && running.vault !== v) throw new UserError(409, `Another analysis is running (${running.vault}). Try again when it finishes.`);
      if (running) return json(res, 202, running);
      const job: Job = { vault: v, state: "running", stage: "queued", log: [], started: new Date().toISOString() };
      jobs.set(v, job);
      void runAnalysis(job, holder);
      return json(res, 202, job);
    }
    if (url.pathname === "/api/replay" && req.method === "POST") {
      const out = await exclusive(() => new Promise<{ code: number; log: string }>((resolve) => {
        const p = spawn(process.execPath, ["--import", "tsx", "src/cli/replay.ts", qv], { cwd: process.cwd() });
        let log = "";
        p.stdout.on("data", (d) => (log += d));
        p.stderr.on("data", (d) => (log += d));
        p.on("close", (code) => resolve({ code: code ?? 1, log }));
      }));
      runner = null; // the replay process moved the fork's base snapshot: re-init on next run
      const rf = manifestPath(qv).replace("manifests", "replays");
      return json(res, 200, { ...out, replay: existsSync(rf) ? JSON.parse(readFileSync(rf, "utf8")) : null });
    }
    json(res, 404, { error: "not found" });
  } catch (e) {
    if (e instanceof UserError) return json(res, e.status, { error: e.message });
    console.error(e);
    // the local fork stopped or is restarting (seen in the end-to-end test: the demo supervisor brings it back in ~8 s)
    if (/fetch failed|ECONNREFUSED|ECONNRESET|socket hang up/i.test(String((e as Error)?.message ?? e))) {
      runner = null;
      return json(res, 503, { error: "The local fork (127.0.0.1:8545) did not answer: it is stopped or restarting. Retry in a few seconds; npm run demo restarts it automatically." });
    }
    json(res, 500, { error: "Internal error: " + String((e as Error).message ?? e).split("\n")[0].slice(0, 300) });
  }
});
server.listen(PORT, "127.0.0.1", () => console.log(`[exitproof-api] http://127.0.0.1:${PORT}`));

// Never let one failed analysis take the demo server down.
process.on("unhandledRejection", (e) => console.error("[exitproof-api] unhandled rejection:", e));
process.on("uncaughtException", (e) => console.error("[exitproof-api] uncaught exception:", e));

async function jsonBody(req: http.IncomingMessage): Promise<Record<string, any>> {
  const raw = (await readBody(req)) || "{}";
  try { return JSON.parse(raw); } catch { throw new UserError(400, "The request body must be JSON, e.g. {\"vault\": \"0x...\"}."); }
}
