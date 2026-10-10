/**
 * Local API for the UI (127.0.0.1:8700). Serves the precomputed report/graphs and runs scenarios
 * live on the fork (one at a time: the fork is a single shared state).
 */
import http from "node:http";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { getAddress, type Address } from "viem";
import { ForkEngine } from "../engine/fork.ts";
import { ScenarioRunner, type Scenario, type ScenarioAction } from "../engine/scenario.ts";
import { loadGraph } from "../discovery/load.ts";
import { FORK_FACT, RUN_HYPOTHESIS, shockActions } from "../scenarios/catalog.ts";
import { ACTORS, NODE_URL, PROXY_URL, SOURCE } from "../lib/constants.ts";
import { rpcRaw } from "../lib/rpc.ts";
import { toJson } from "../lib/util.ts";

const PORT = Number(process.env.EXITPROOF_API_PORT ?? 8700);

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
async function getRunner() {
  if (!runner) {
    engine = new ForkEngine();
    await engine.init();
    runner = new ScenarioRunner(engine);
  }
  return runner;
}

function buildCustom(body: { exits?: string[]; shock?: { feed: Address; factor: number } }): Scenario {
  const V = ACTORS.steakhouseEth;
  const target = { vault: V, holder: ACTORS.A };
  const actions: ScenarioAction[] = [{ type: "measure", label: "source state" }];
  const hyps = [FORK_FACT];
  if (body.shock) {
    const g = loadGraph(V);
    const { actions: sa } = shockActions(g, { kind: "feed", feed: body.shock.feed, factor: body.shock.factor, label: "" });
    actions.push(...sa, { type: "measure", label: "after shock and liquidations" });
    hyps.push("Shock hypothesis: oracle replaced on the fork by one returning the shocked price; all unhealthy borrowers liquidated.");
  }
  for (const k of body.exits ?? []) {
    const a = ACTOR_EXITS[k];
    if (!a) throw new Error(`unknown actor ${k}`);
    actions.push({ type: "exit", label: a.label, vault: a.vault, owner: a.owner, action: { kind: "redeemAll" } });
  }
  if ((body.exits ?? []).length) hyps.push(RUN_HYPOTHESIS);
  actions.push(
    { type: "measure", label: "before the holder's exit" },
    { type: "exit", label: "holder exits everything (redeem all shares)", vault: V, owner: ACTORS.A, action: { kind: "redeemAll" } },
    { type: "exit", label: "holder withdraws its maximum", vault: V, owner: ACTORS.A, action: { kind: "withdrawMax" } },
    { type: "measure", label: "end" },
  );
  return { id: `custom_${(body.exits ?? []).join("_") || "none"}${body.shock ? "_shock" : ""}`, title: "Custom run", target, hypotheses: hyps, actions };
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
    if (url.pathname === "/api/report") return json(res, 200, readFileSync("results/report.json", "utf8"));
    if (url.pathname === "/api/manifest") return json(res, 200, readFileSync("results/manifest.json", "utf8"));
    if (url.pathname === "/api/replay-last") return json(res, 200, existsSync("results/replay.json") ? readFileSync("results/replay.json", "utf8") : "{}");
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
      const body = JSON.parse((await readBody(req)) || "{}");
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
    if (url.pathname === "/api/replay" && req.method === "POST") {
      const out = await exclusive(() => new Promise<{ code: number; log: string }>((resolve) => {
        const p = spawn(process.execPath, ["--import", "tsx", "src/cli/replay.ts"], { cwd: process.cwd() });
        let log = "";
        p.stdout.on("data", (d) => (log += d));
        p.stderr.on("data", (d) => (log += d));
        p.on("close", (code) => resolve({ code: code ?? 1, log }));
      }));
      runner = null; // the replay process moved the fork's base snapshot: re-init on next run
      return json(res, 200, { ...out, replay: existsSync("results/replay.json") ? JSON.parse(readFileSync("results/replay.json", "utf8")) : null });
    }
    json(res, 404, { error: "not found" });
  } catch (e) {
    json(res, 500, { error: String((e as Error).message ?? e) });
  }
});
server.listen(PORT, "127.0.0.1", () => console.log(`[exitproof-api] http://127.0.0.1:${PORT}`));
