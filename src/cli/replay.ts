/**
 * Replay: re-execute every scenario of results/manifest.json on a fresh fork and compare amounts,
 * statuses, decoded errors and measurements to the wei. Transaction hashes are not compared
 * (they vary between runs); the timestamp convention is the one recorded in the manifest.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { ForkEngine } from "../engine/fork.ts";
import { ScenarioRunner, type Scenario, type ScenarioResult } from "../engine/scenario.ts";
import { findCushion } from "../engine/cushion.ts";
import { manifestHash } from "../report/build.ts";
import { toJson } from "../lib/util.ts";

const file = process.argv[2] ?? "results/manifest.json";
const m = JSON.parse(readFileSync(file, "utf8"));
const hashOk = manifestHash(m) === m.sha256;
console.log(`manifest ${file}: sha256 ${hashOk ? "OK" : "MISMATCH (file edited?)"}`);

/** Strip fields that are not part of the deterministic contract, keep everything else. */
const norm = (r: ScenarioResult) => JSON.parse(toJson(r), (k, v) => (k === "raw" && typeof v === "string" && !v.startsWith("0x") ? undefined : v));

function diff(a: unknown, b: unknown, path = ""): string[] {
  if (typeof a !== typeof b) return [`${path}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`];
  if (a && typeof a === "object") {
    const keys = new Set([...Object.keys(a as object), ...Object.keys(b as object)]);
    return [...keys].flatMap((k) => diff((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], `${path}.${k}`));
  }
  return a === b ? [] : [`${path}: expected ${JSON.stringify(a)} got ${JSON.stringify(b)}`];
}

const eng = new ForkEngine();
await eng.init();
const runner = new ScenarioRunner(eng);
const report: { id: string; ok: boolean; diffs: string[] }[] = [];
for (const { scenario, expected } of m.scenarios as { scenario: Scenario; expected: ScenarioResult }[]) {
  const got = await runner.run(scenario);
  const d = diff(norm(expected), norm(got));
  report.push({ id: scenario.id, ok: d.length === 0, diffs: d.slice(0, 10) });
  console.log(`${d.length === 0 ? "OK  " : "FAIL"} ${scenario.id}${d.length ? "\n     " + d.slice(0, 5).join("\n     ") : ""}`);
}
const c = m.cushion;
const c2 = await findCushion(runner, m.scenarios[0].scenario.target.vault, m.scenarios[0].scenario.target.holder, c.otherHolder, BigInt(c.probes[1].amount) /* probe #1 is the upper bound */, BigInt(c.precisionWei));
const cushionOk = c2.passesAt === c.passesAt && c2.revertsAt === c.revertsAt;
console.log(`${cushionOk ? "OK  " : "FAIL"} cushion passes at ${c2.passesAt}, reverts at ${c2.revertsAt}`);
await eng.reset();
const allOk = hashOk && cushionOk && report.every((r) => r.ok);
writeFileSync("results/replay.json", toJson({ at: new Date().toISOString(), manifest: file, manifestSha256: m.sha256, hashOk, cushionOk, scenarios: report, verdict: allOk ? "REPLAY OK" : "REPLAY FAILED" }));
console.log(allOk ? `\nREPLAY OK: ${report.length} scenarios + cushion identical to the wei` : "\nREPLAY FAILED");
process.exit(allOk ? 0 : 1);
