/**
 * Full pipeline for the demo vaults: discovery -> report (executed scenarios) -> replay check.
 * Run once online to warm every cache (proxy + Hardhat), then everything replays offline.
 * Usage: tsx src/cli/all.ts [vault ...]
 */
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { discover } from "../discovery/discover.ts";
import { buildReport } from "../report/build.ts";
import { toJson } from "../lib/util.ts";
import { mkdirSync } from "node:fs";
import type { Address } from "viem";

export const DEMO_VAULTS: Address[] = [
  "0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4", // Steakhouse ETH (curated scenarios)
  "0x2371e134e3455e0593363cBF89d3b6cf53740618", // Gauntlet WETH Prime
  "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB", // Steakhouse USDC
];

const vaults = (process.argv.slice(2).filter((a) => a.startsWith("0x")) as Address[]);
const list = vaults.length ? vaults : DEMO_VAULTS;
const summary: Record<string, unknown>[] = [];
for (const v of list) {
  const t0 = Date.now();
  const g = await discover(v, {});
  mkdirSync("results/discovery", { recursive: true });
  writeFileSync(`results/discovery/${g.target.vault}.json`, toJson(g));
  console.log(`[discover] ${g.target.name}: ${g.nodes.length} nodes, ${g.reads.length} reads`);
  await buildReport(g.target.vault, undefined, (s) => console.log("[build] " + s));
  // replay in a separate process, exactly as a reviewer would run it
  const rp = spawnSync(process.execPath, ["--import", "tsx", "src/cli/replay.ts", g.target.vault], { encoding: "utf8" });
  const ok = rp.status === 0;
  console.log(`[replay] ${g.target.name}: ${ok ? "REPLAY OK" : "REPLAY FAILED\n" + rp.stdout + rp.stderr}`);
  summary.push({ vault: g.target.vault, name: g.target.name, replayOk: ok, seconds: Math.round((Date.now() - t0) / 1000) });
}
console.table(summary);
process.exit(summary.every((s) => s.replayOk) ? 0 : 1);
