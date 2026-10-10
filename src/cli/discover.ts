/** Usage: tsx src/cli/discover.ts <vault> [--no-peers] [--no-borrowers] */
import { mkdirSync, writeFileSync } from "node:fs";
import type { Address } from "viem";
import { discover } from "../discovery/discover.ts";
import { ACTORS } from "../lib/constants.ts";
import { fmt, toJson } from "../lib/util.ts";

const vault = (process.argv.find((a) => a.startsWith("0x")) ?? ACTORS.steakhouseEth) as Address;
const t0 = Date.now();
const g = await discover(vault, {
  peers: !process.argv.includes("--no-peers"),
  borrowers: !process.argv.includes("--no-borrowers"),
  log: (s) => console.log(s),
});
mkdirSync("results/discovery", { recursive: true });
const file = `results/discovery/${g.target.vault}.json`;
writeFileSync(file, toJson(g));
const s = g.summary as Record<string, bigint | number>;
console.log(`\n${g.target.name} (${g.target.version}) @ block ${g.source.block}`);
const d = g.target.assetDecimals;
console.log(`totalAssets ${fmt(s.totalAssets as bigint, d)} ${g.target.assetSymbol}, withdrawable ${fmt(s.withdrawableNow as bigint, d, 3)}, lent out ${fmt(s.lentOutNotWithdrawable as bigint, d)}`);
console.log(`nodes ${g.nodes.length}, edges ${g.edges.length}, reads ${g.reads.length}, peers ${g.peers.length} -> ${file} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
for (const n of g.nodes) console.log(`  L${n.layer} ${n.kind.padEnd(11)} ${n.label}`);
