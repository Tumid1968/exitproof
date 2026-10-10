/**
 * One command for the live demo: proxy → fork → API → web, each started only when the previous one
 * answers, restarted automatically if it dies or stops answering, then the browser is opened.
 *   npm run demo                # proxy online
 *   npm run demo -- --offline   # proxy serves the disk cache only (no network)
 *   npm run demo -- --no-open   # do not open the browser
 * A service already running on its port (started by hand) is reused, not duplicated.
 */
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { createWriteStream, mkdirSync } from "node:fs";

const offline = process.argv.includes("--offline");
const open = !process.argv.includes("--no-open");
const win = process.platform === "win32";
mkdirSync("cache", { recursive: true });

type Svc = {
  name: string;
  cmd: string[];
  health: () => Promise<boolean>;
  child?: ChildProcess;
  external?: boolean;
  fails: number;
  restarts: number;
};

const post = (url: string, method: string) => fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: [] }), signal: AbortSignal.timeout(3000) }).then((r) => r.json());
const get = (url: string) => fetch(url, { signal: AbortSignal.timeout(3000) });

const services: Svc[] = [
  { name: "proxy", cmd: ["npx", "tsx", "src/proxy/rpcProxy.ts", offline ? "offline" : "online"], fails: 0, restarts: 0,
    health: async () => { try { const j = await (await get("http://127.0.0.1:8600")).json(); return j.service === "exitproof-proxy" && j.mode === (offline ? "offline" : "online"); } catch { return false; } } },
  { name: "fork", cmd: ["npx", "hardhat", "node", "--fork", "http://127.0.0.1:8600", "--fork-block-number", "26157638"], fails: 0, restarts: 0,
    health: async () => { try { return (await post("http://127.0.0.1:8545", "eth_chainId")).result !== undefined; } catch { return false; } } },
  { name: "api", cmd: ["npx", "tsx", "src/server/server.ts"], fails: 0, restarts: 0,
    health: async () => { try { return (await get("http://127.0.0.1:8700/api/status")).ok; } catch { return false; } } },
  { name: "web", cmd: ["npx", "vite", "--config", "web/vite.config.ts"], fails: 0, restarts: 0,
    health: async () => { try { return (await get("http://127.0.0.1:5173/")).ok; } catch { return false; } } },
];

const log = (s: string) => console.log(`[demo ${new Date().toLocaleTimeString()}] ${s}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function kill(c?: ChildProcess) {
  if (!c?.pid) return;
  if (win) spawnSync("taskkill", ["/pid", String(c.pid), "/T", "/F"], { stdio: "ignore" }); // whole tree (npx → node)
  else c.kill("SIGTERM");
}

function start(s: Svc) {
  const out = createWriteStream(`cache/demo-${s.name}.log`, { flags: "a" });
  out.write(`\n--- start ${new Date().toISOString()} ---\n`);
  const c = spawn(s.cmd[0], s.cmd.slice(1), { shell: win, stdio: ["ignore", "pipe", "pipe"] });
  c.stdout?.pipe(out); c.stderr?.pipe(out);
  c.on("exit", (code) => { if (s.child === c) { log(`${s.name} exited (code ${code})`); s.child = undefined; } });
  s.child = c;
}

async function waitHealthy(s: Svc, timeoutMs: number) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { if (await s.health()) return true; await sleep(1000); }
  return false;
}

async function bringUp(s: Svc) {
  if (await s.health()) { s.external = !s.child; if (s.external) log(`${s.name}: already running, reused`); return true; }
  start(s);
  const ok = await waitHealthy(s, s.name === "fork" ? 90_000 : 45_000);
  log(`${s.name}: ${ok ? "up" : "NOT answering (see cache/demo-" + s.name + ".log)"}`);
  return ok;
}

let stopping = false;
async function main() {
  log(`starting (${offline ? "offline: proxy serves the disk cache only" : "online"})`);
  for (const s of services) if (!(await bringUp(s))) { log(`cannot start ${s.name}; the UI will still open in static replay mode`); break; }
  if (open && (await services[3].health())) {
    const url = "http://127.0.0.1:5173/";
    if (win) spawn("cmd", ["/c", "start", "", url], { stdio: "ignore", detached: true });
    else spawn(process.platform === "darwin" ? "open" : "xdg-open", [url], { stdio: "ignore", detached: true });
    log(`browser opened on ${url} (status page: ${url}#/status)`);
  }
  // supervision: 3 failed health checks in a row (or an exit) → restart
  for (;;) {
    await sleep(5000);
    if (stopping) return;
    for (const s of services) {
      if (await s.health()) { s.fails = 0; continue; }
      s.fails++;
      if (s.fails < 3 && s.child) continue;
      log(`${s.name} is down (${s.fails} failed checks): restarting`);
      kill(s.child);
      s.child = undefined; s.fails = 0; s.restarts++;
      await bringUp(s);
    }
  }
}

const shutdown = () => {
  if (stopping) return;
  stopping = true;
  log("stopping all services started by this command");
  for (const s of [...services].reverse()) if (!s.external) kill(s.child);
  setTimeout(() => process.exit(0), 500);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
main().catch((e) => { log(String(e)); shutdown(); });
