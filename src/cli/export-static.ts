/**
 * Export results/ for the static replay site (web/public/data → copied into the build).
 * Files are plain scripts assigning to window.__EXITPROOF__, so the site also works when opened from disk
 * (file:// forbids fetch() of local JSON but allows <script src>). No network, no fork, no RPC key.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = "web/public/data";
const SECRET = /(drpc\.org\/[a-z0-9]{16,}|alchemy\.com\/v2\/[A-Za-z0-9_-]{8,}|infura\.io\/v3\/[0-9a-f]{16,}|api[_-]?key|apikey|secret|bearer\s+[A-Za-z0-9]|EXITPROOF_RPC_URL=)/i;

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const wrap = (key: string, json: string) => `window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__[${JSON.stringify(key)}]=${json};\n`;
const write = (file: string, key: string, json: string) => {
  if (SECRET.test(json)) throw new Error(`refusing to export ${file}: it matches a secret pattern`);
  writeFileSync(join(OUT, file), wrap(key, json));
};

const index: Record<string, unknown>[] = [];
for (const f of readdirSync("results/reports")) {
  const vault = f.replace(".json", "");
  const report = readFileSync(`results/reports/${f}`, "utf8");
  const graph = readFileSync(`results/discovery/${f}`, "utf8");
  const r = JSON.parse(report);
  const m = JSON.parse(readFileSync(`results/manifests/${f}`, "utf8"));
  const replay = existsSync(`results/replays/${f}`) ? JSON.parse(readFileSync(`results/replays/${f}`, "utf8")) : null;
  write(`report-${vault}.js`, `report:${vault}`, report);
  write(`graph-${vault}.js`, `graph:${vault}`, graph);
  if (existsSync(`results/refine/${f}`)) write(`refine-${vault}.js`, `refine:${vault}`, readFileSync(`results/refine/${f}`, "utf8"));
  index.push({
    vault, name: r.target.name, version: r.target.version, asset: r.target.assetSymbol, catalog: r.catalog,
    totalAssets: r.vault.totalAssets, assetDecimals: r.target.assetDecimals,
    manifest: { file: `results/manifests/${f}`, sha256: m.sha256, createdAt: m.created_at, scenarios: m.scenarios.length, cushionProbes: m.cushion?.probes?.length ?? 0 },
    replay: replay ? { verdict: replay.verdict, at: replay.at, hashOk: replay.hashOk, cushionOk: replay.cushionOk, scenarios: replay.scenarios.length, okScenarios: replay.scenarios.filter((x: { ok: boolean }) => x.ok).length } : null,
  });
}
if (existsSync("results/history/steth-eth.json")) write("history-steth-eth.js", "history:steth-eth", readFileSync("results/history/steth-eth.json", "utf8"));
index.sort((a, b) => (a.name === "Steakhouse ETH" ? -1 : b.name === "Steakhouse ETH" ? 1 : String(a.name).localeCompare(String(b.name))));
write("index.js", "index", JSON.stringify({ source: { chainId: 1, block: "26157638", blockHash: "0x3e8450286456e913f08f2290aa3eac5e0c8b6d5be51bef3955032d9c43977bf4", timestamp: "1791582443" }, exportedAt: new Date().toISOString(), vaults: index }));
console.log(`exported ${index.length} vaults to ${OUT}`);
