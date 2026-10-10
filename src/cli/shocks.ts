/** Quick analytic sweep: tsx src/cli/shocks.ts [vault] */
import type { Address } from "viem";
import { loadGraph } from "../discovery/load.ts";
import { propagate, type Shock } from "../shocks/analytic.ts";
import { ACTORS } from "../lib/constants.ts";
import { fmt } from "../lib/util.ts";

const vault = (process.argv.find((a) => a.startsWith("0x")) ?? ACTORS.steakhouseEth) as Address;
const g = loadGraph(vault);
const feeds = g.nodes.filter((n) => n.kind === "feed");
for (const f of feeds) console.log("feed", f.address, f.data.description);
const shocks: Shock[] = [];
for (const f of feeds) for (const x of [0.99, 0.97, 0.95, 0.9, 0.8])
  shocks.push({ kind: "feed", feed: f.address!, factor: x, label: `${f.data.description} x${x}` });
for (const r of shocks.map((s) => propagate(g, s))) {
  if (!r.markets.length) continue;
  console.log(`${r.shock.label.padEnd(36)} loss ${fmt(r.vaultLoss, g.target.assetDecimals)} (${r.vaultLossPct.toFixed(3)}%) withdrawable ${fmt(r.vaultWithdrawableBefore, g.target.assetDecimals)} -> ${fmt(r.vaultWithdrawableAfter, g.target.assetDecimals)}  ` +
    r.markets.map((m) => `[${m.label} liq=${m.liquidatable} bd=${fmt(m.badDebt, g.target.assetDecimals)}]`).join(" "));
}
