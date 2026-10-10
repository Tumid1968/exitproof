/** Run scenarios on the fork: tsx src/cli/run.ts [scenarioId ...] */
import { mkdirSync, writeFileSync } from "node:fs";
import { formatEther } from "viem";
import { ForkEngine } from "../engine/fork.ts";
import { ScenarioRunner, type ScenarioResult } from "../engine/scenario.ts";
import { loadGraph } from "../discovery/load.ts";
import { steakhouseEthCatalog } from "../scenarios/catalog.ts";
import { ACTORS } from "../lib/constants.ts";
import { toJson } from "../lib/util.ts";

const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
const g = loadGraph(ACTORS.steakhouseEth);
const catalog = steakhouseEthCatalog(g).scenarios.filter((s) => only.length === 0 || only.includes(s.id));
const eng = new ForkEngine();
await eng.init();
const runner = new ScenarioRunner(eng);
const out: ScenarioResult[] = [];
mkdirSync("results/scenarios", { recursive: true });
for (const s of catalog) {
  const t0 = Date.now();
  const r = await runner.run(s);
  out.push(r);
  writeFileSync(`results/scenarios/${s.id}.json`, toJson({ scenario: s, result: r }));
  console.log(`\n== ${s.id} (${((Date.now() - t0) / 1000).toFixed(1)} s, ${r.txCount} tx)`);
  for (const a of r.results) {
    if (a.type === "exit") console.log(`  exit k=${a.result.k} ${a.label}: ok=${a.result.ok} out=${formatEther(BigInt(a.result.assetsOutWei))} ${a.result.error?.name ?? ""}`);
    if (a.type === "oraclePrice") console.log(`  ${a.label}: ${a.priceBefore} -> ${a.priceAfter}`);
    if (a.type === "liquidateAll") console.log(`  ${a.label}: ${a.liquidated}/${a.attempted} liquidated, repaid ${formatEther(BigInt(a.repaidAssets))}, bad debt ${formatEther(BigInt(a.badDebtRealised))}`);
    if (a.type === "measure") console.log(`  [${a.label}] vault ${formatEther(BigInt(a.m.vaultTotalAssets))} holder value ${formatEther(BigInt(a.m.holderValue))} maxWithdraw ${formatEther(BigInt(a.m.holderMaxWithdraw))}`);
  }
}
