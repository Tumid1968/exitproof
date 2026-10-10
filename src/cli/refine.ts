/** Usage: tsx src/cli/refine.ts   writes results/refine/<vault>.json for every report (derived indicators, no execution). */
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import type { Address } from "viem";
import { buildRefine } from "../refine/refine.ts";
import { toJson } from "../lib/util.ts";

mkdirSync("results/refine", { recursive: true });
for (const f of readdirSync("results/reports")) {
  const v = f.replace(".json", "") as Address;
  const out = buildRefine(v);
  writeFileSync(`results/refine/${f}`, toJson(out));
  const vl = out.vaultLevel ? `${(out.vaultLevel.ratio * 100).toFixed(2)} %` : "n/a";
  console.log(`${out.name.padEnd(26)} exit ${out.exitWindow.kind.padEnd(9)} timelock ${out.governance.timelockDays ?? "?"} d · vault-level ${vl.padEnd(8)} HHI ${out.concentration.byMarket.hhi.toFixed(3)} (${out.concentration.byMarket.word}) · regimes ${out.regimes.byRegime.map((x) => `${x.regime} ${(x.exposureShare * 100).toFixed(1)} %`).join(", ")}${out.history ? " · history" : ""}`);
}
