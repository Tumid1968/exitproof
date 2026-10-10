/**
 * End-to-end test of the site in a real browser (Chrome installed on the machine, driven by playwright-core;
 * no browser download). Every expected value is read from results/ and docs/data/ by the test itself,
 * plus a few hard-coded guard values from the acceptance table (CLAUDE.md §4).
 *
 *   npm run test:e2e                      A: docs/ over a local HTTP server and over file://  ·  B: live mode if `npm run demo` runs
 *   E2E_URL=https://… npm run test:e2e:url  C: the same static checks against a deployed copy (e.g. GitHub Pages)
 *   E2E_KILL_FORK=1 npm run test:e2e      B also kills the real fork process (the demo supervisor restarts it)
 *
 * No arbitrary sleeps: waits are on elements, events or page state. The only timed window is the
 * reduced-motion measurement (does the canvas change during 700 ms?), with a positive control.
 * Failures save a screenshot in results/e2e-failures/.
 */
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { mkdirSync, readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execSync } from "node:child_process";
import { createRequire } from "node:module";
import vm from "node:vm";
import { chromium, type Browser, type BrowserContextOptions, type Page } from "playwright-core";
import { manifestHash } from "../../src/report/build.ts";
import { parseAmount, sizeCase } from "../../src/verdict/size.ts";

declare global { interface Window { __epFps?: number } }

const ROOT = resolve(import.meta.dirname, "../..");
const DOCS = join(ROOT, "docs");
const FAIL_DIR = join(ROOT, "results/e2e-failures");
const AXE = createRequire(import.meta.url).resolve("axe-core/axe.min.js");
const STEAKHOUSE = "0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4";
const LIVE_URL = process.env.E2E_LIVE_URL ?? "http://127.0.0.1:5173/";
const EXTERNAL = process.env.E2E_URL;

// ---------- expected data, read from the repository ----------
const readJson = (p: string) => JSON.parse(readFileSync(join(ROOT, p), "utf8"));
const staticData = (file: string) => {
  const sandbox: { window: { __EXITPROOF__?: Record<string, any> } } = { window: {} };
  vm.runInNewContext(readFileSync(join(DOCS, "data", file), "utf8"), sandbox);
  return JSON.parse(JSON.stringify(sandbox.window.__EXITPROOF__)); // plain objects of this realm
};
const INDEX = staticData("index.js").index as { source: { block: string }; vaults: { vault: string; name: string; replay?: any; manifest?: any }[] };
const report = (v: string) => readJson(`results/reports/${v}.json`);

/** exact decimal formatting of a smallest-unit integer, half-up, with thousands separators */
function fmtUnits(x: string | bigint, decimals: number, dp = 2) {
  const v = BigInt(x), neg = v < 0n, a = neg ? -v : v;
  const scale = 10n ** BigInt(decimals), q = 10n ** BigInt(dp);
  const r = (a * q * 2n + scale) / (2n * scale); // round half up
  const int = (r / q).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const frac = dp ? "." + (r % q).toString().padStart(dp, "0") : "";
  return (neg ? "-" : "") + int + frac;
}
const fmtPct = (x: number) => (x * 100).toFixed(2) + "%";
/** visible text with all whitespace (tabs, line breaks of flex items, no-break spaces) collapsed */
const norm = (t: string) => t.replace(/\s+/g, " ").trim();

/** the five scenario pills: worst executed run of each kind (same rule as the opening screen) */
function expectedPills(r: any) {
  const inV = (x: any) => x.others.every((o: any) => o.vault === r.target.vault);
  const worst = (xs: any[]) => [...xs].sort((a, b) => a.changePct - b.changePct)[0];
  const pills: [string, any][] = [["Alone", r.runs[0]],
    ["One holder before me", worst(r.runs.filter((x: any) => x.others.length === 1 && inV(x)))],
    ["Two holders", worst(r.runs.filter((x: any) => x.others.length >= 2 && inV(x)))],
    ["Another vault", worst(r.runs.filter((x: any) => x.others.length === 1 && !inV(x)))],
    ["Both vaults", worst(r.runs.filter((x: any) => x.others.length >= 2 && !inV(x)))]];
  return pills.filter(([, run]) => run);
}
function replayFact(v: string) {
  const rp = readJson(`results/replays/${v}.json`);
  const ok = rp.scenarios.filter((s: any) => s.ok).length;
  return `${ok}/${rp.scenarios.length} ${ok === rp.scenarios.length && rp.hashOk && rp.cushionOk ? "OK" : "FAILED"}`;
}

/** every vault replayed OK, according to the index AND to the replay files */
function allReplayedOk() {
  return INDEX.vaults.every((v) => v.replay?.verdict === "REPLAY OK" && v.replay.okScenarios === v.replay.scenarios && replayFact(v.vault).endsWith("OK"));
}

// ---------- harness ----------
const DESKTOP: BrowserContextOptions = { viewport: { width: 1440, height: 900 } };
const MOBILE: BrowserContextOptions = { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
let browser: Browser;
let server: Server | undefined;
const metrics: Record<string, unknown>[] = [];
const warnings: string[] = [];

type H = { page: Page; errors: string[]; requests: string[]; origin: string };
const isLocal = (u: string, origin: string) =>
  /^(file:|data:|blob:|about:|http:\/\/127\.0\.0\.1[:/]|http:\/\/localhost[:/])/.test(u) || (origin !== "null" && u.startsWith(origin + "/"));

async function withPage(name: string, base: string, opts: BrowserContextOptions & { hash?: string }, fn: (h: H) => Promise<void>) {
  const { hash, ...ctxOpts } = opts;
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const errors: string[] = [], requests: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("request", (r) => requests.push(r.url()));
  page.on("response", (r) => { if (r.status() >= 400) errors.push(`HTTP ${r.status()} ${r.url()}`); });
  const url = base + (hash ? `#${hash}` : "");
  try {
    await page.goto(url, { waitUntil: "load" });
    await fn({ page, errors, requests, origin: new URL(url).origin });
  } catch (e) {
    mkdirSync(FAIL_DIR, { recursive: true });
    const file = join(FAIL_DIR, `${name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.png`);
    await page.screenshot({ path: file, fullPage: false }).catch(() => undefined);
    (e as Error).message += `\n  screenshot: ${file}`;
    throw e;
  } finally { await ctx.close(); }
}

const amount = async (page: Page) => (await page.locator(".bignum .amount").innerText()).replace(/\s*\S+$/, "").trim(); // drop the unit
/** the newcomer view is ready: the one-word answer is shown */
const waitAnswer = (page: Page) => page.waitForFunction(() => { const w = document.querySelector(".bigword"); return !!w && w.textContent !== "…"; }, null, { timeout: 15_000 });
const openWhy = async (page: Page) => { const b = page.getByRole("button", { name: "Why?" }); if ((await b.getAttribute("aria-expanded")) !== "true") await b.click(); await page.locator("#why").waitFor(); };
const countWords = (t: string) => t.split(/\s+/).filter((x) => /[A-Za-z0-9]/.test(x)).length;
/** sentences: split on . ! ? followed by a space, or on a line break (so 2,079.21 stays one number) */
const sentencesOf = (t: string) => t.split(/(?<=[.!?])\s+|\n+/).map((x) => x.trim()).filter((x) => countWords(x) > 0);
/** expert mode is closed by default: open it, then wait for the executed amount */
async function waitAmount(page: Page) {
  await page.locator(".bigword, section.card.bad").first().waitFor({ timeout: 15_000 });
  const b = page.getByRole("button", { name: /^Expert mode/ });
  if (await b.isVisible()) await b.click();
  await page.locator(".bignum .amount").waitFor({ state: "visible", timeout: 15_000 });
}
/** visible text of an element without the "?" buttons, select options and open tooltips */
const visibleText = (page: Page, sel: string) => page.locator(sel).evaluate((el) => {
  const c = el.cloneNode(true) as HTMLElement;
  c.querySelectorAll(".qbtn, select, .tip").forEach((x) => x.remove());
  document.body.appendChild(c); const t = c.innerText; c.remove(); return t;
});
const JARGON: [string, RegExp][] = [["oracle", /oracle/i], ["queue", /\bqueue\b/i], ["wstETH", /wstETH/], ["Morpho", /Morpho/], ["HHI", /\bHHI\b/], ["ℓ", /ℓ/], ["W", /\bW\b/], ["p*", /p\*/], ["basis points", /basis points/i]];
const jargonIn = (t: string) => JARGON.filter(([, re]) => re.test(t)).map(([k]) => k);
const pill = (page: Page, label: string) => page.locator(".pills [role=tab]", { hasText: new RegExp(`^${label}$`) });
async function clickPill(page: Page, label: string) {
  await pill(page, label).click();
  await assert.doesNotReject(pill(page, label).and(page.locator("[aria-selected=true]")).waitFor({ timeout: 5000 }));
}
const showAll = (page: Page) => page.evaluate(() => document.querySelectorAll(".sr").forEach((e) => e.classList.add("in"))); // as if scrolled through
async function axe(page: Page, rules: string[]) {
  if (!(await page.evaluate(() => "axe" in window))) await page.addScriptTag({ path: AXE });
  return page.evaluate(async (values) => {
    const r = await (window as any).axe.run(document, { runOnly: { type: "rule", values }, resultTypes: ["violations"] });
    return r.violations.map((v: any) => ({ id: v.id, impact: v.impact, n: v.nodes.length, nodes: v.nodes.slice(0, 4).map((x: any) => `${x.target.join(" ")} :: ${x.failureSummary?.split("\n")[1]?.trim() ?? ""}`) }));
  }, rules);
}

before(async () => {
  browser = await chromium.launch({ channel: "chrome" });
  if (!EXTERNAL) {
    const types: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".txt": "text/plain", ".json": "application/json" };
    server = createServer((req, res) => {
      const p = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
      const file = join(DOCS, p.endsWith("/") ? p + "index.html" : p);
      if (!file.startsWith(DOCS) || !existsSync(file)) { res.writeHead(404); res.end("not found"); return; }
      res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
      res.end(readFileSync(file));
    });
    await new Promise<void>((ok) => server!.listen(0, "127.0.0.1", ok));
  }
});
after(async () => {
  await browser?.close();
  server?.close();
  mkdirSync(join(ROOT, "results/e2e"), { recursive: true });
  writeFileSync(join(ROOT, "results/e2e/last-run.json"), JSON.stringify({ at: new Date().toISOString(), target: EXTERNAL ?? "local", metrics, warnings }, null, 2) + "\n");
  console.log("\n--- e2e metrics ---");
  for (const m of metrics) console.log(JSON.stringify(m));
  for (const w of warnings) console.log("warning:", w);
});

// ---------- A / C: static site ----------
const targets = EXTERNAL
  ? [{ id: "url", base: () => EXTERNAL.replace(/#.*$/, "") }]
  : [{ id: "http", base: () => `http://127.0.0.1:${(server!.address() as { port: number }).port}/` },
     { id: "file", base: () => pathToFileURL(join(DOCS, "index.html")).href }];

for (const tg of targets) {
  for (const [vp, opts] of [["1440", DESKTOP], ["375", MOBILE]] as const) {
    describe(`static ${tg.id} ${vp}px`, () => {
      const T = (n: string) => `${tg.id}-${vp}-${n}`;

      test("1. loads without console errors or external requests; static mode never calls the API", () => withPage(T("load"), tg.base(), opts, async ({ page, errors, requests, origin }) => {
        await waitAnswer(page);
        const ms = await page.evaluate(() => Math.round(performance.now()));
        metrics.push({ target: tg.id, viewport: vp, firstAnswerMs: ms, requests: requests.length });
        assert.ok(ms < 10_000, `answer displayed after ${ms} ms (limit 10 s)`);
        // open "Why?" and expert mode: still no request leaving the machine, and no /api/ call in static mode
        await openWhy(page);
        await waitAmount(page);
        const external = requests.filter((u) => !isLocal(u, origin));
        assert.deepEqual(external, [], `external requests:\n${external.join("\n")}`);
        assert.deepEqual(requests.filter((u) => /\/api\//.test(u)), [], "the static site called the local API");
        assert.deepEqual(errors, []);
      }));

      test("2. main screen: exit word, worst executed case X of Y with a bar, from results/; no '?' on it; facts in expert mode", () => withPage(T("main"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        const rf = readJson(`results/refine/${STEAKHOUSE}.json`);
        const r = report(STEAKHOUSE);
        assert.equal(await page.locator(".bigword").innerText(), rf.answer.word);
        assert.match(await page.locator(".bigword").getAttribute("class") ?? "", new RegExp(`w-${rf.answer.level}`));
        const run = r.runs.find((x: any) => x.id === rf.answer.worstRun.id);
        // default amount = the largest position: the numbers are the report's (2,079.21, −60.09 %, 1 in 89, 1 in 18)
        assert.equal(await page.getByRole("textbox", { name: "how much did you put in" }).inputValue(), fmtUnits(r.target.holderValue, 18));
        assert.equal(norm(await page.locator(".figure").innerText()), `If others leave first, ${fmtUnits(run.holderExecutedExit, 18)} of your ${fmtUnits(r.target.holderValue, 18)} WETH comes out right away (${run.changePct.toFixed(2)} %).`);
        assert.deepEqual([fmtUnits(run.holderExecutedExit, 18), fmtUnits(r.target.holderValue, 18), run.changePct], ["2,079.21", "5,209.91", -60.09], "guard values");
        assert.equal(norm(await page.locator(".wait").innerText()), `${fmtUnits(BigInt(r.target.holderValue) - BigInt(run.holderExecutedExit), 18)} WETH would wait.`);
        assert.equal(await page.locator(".source").first().innerText(), "Scaled from the measured case.");
        assert.equal(norm(await page.locator(".verdictL").innerText()), "The break-even is 1 in 89 this month (1 in 18 if blocked money costs nothing).");
        assert.equal(await page.locator(".verdictL b").count(), 0, "nothing in bold before the slider is touched");
        const width = await page.locator(".leanbar .fill").evaluate((e) => (e as HTMLElement).style.width);
        assert.equal(Math.round(parseFloat(width)), Math.round((rf.answer.worstShare) * 100));
        assert.equal(await page.locator(".lean .qbtn").count(), 0, "no '?' on the main screen");
        assert.equal(await page.locator(".lean a[href='#/glossary'], header a[href='#/glossary']").count(), 0, "no glossary link on the main screen");
        assert.equal(await page.locator("#why").count(), 0, "'Why?' closed by default");
        await waitAmount(page);
        const facts = await page.locator(".expertfacts > div").evaluateAll((ds) => ds.map((d) => [d.querySelector("dt")!.textContent, d.querySelector("dd")!.textContent]));
        const entry = INDEX.vaults.find((v) => v.vault === STEAKHOUSE)!;
        const manifest = readJson(`results/manifests/${STEAKHOUSE}.json`);
        assert.equal(manifest.sha256, entry.manifest.sha256, "index and manifest agree");
        assert.deepEqual(facts, [
          ["Measured on", `a fork of Ethereum, block ${Number(INDEX.source.block).toLocaleString("en-US")}`],
          ["Replayable", replayFact(STEAKHOUSE).endsWith("OK") ? "to the wei" : "replay failed"],
          ["Replay", `${replayFact(STEAKHOUSE)} for this vault${allReplayedOk() ? `all ${INDEX.vaults.length} vaults replayed OK` : ""}`],
          ["Coverage", `${readdirSync(join(ROOT, "results/manifests")).length} Morpho vaults`],
        ]);
      }));

      test("19. jargon: the main screen and every 'Why?' block use none of the technical terms", () => withPage(T("jargon"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        const main = await visibleText(page, ".lean");
        assert.deepEqual(jargonIn(main), [], `main screen: ${main}`);
        await openWhy(page);
        const blocks = await page.locator(".whyblock").count();
        const seen: string[] = [];
        for (let i = 0; i < blocks; i++) { const t = await visibleText(page, `.whyblock >> nth=${i}`); for (const j of jargonIn(t)) seen.push(`block ${i + 1}: ${j}`); }
        assert.deepEqual(seen, []);
        assert.equal(await page.locator(".expert").count(), 0, "expert mode closed by default");
      }));

      test("20. 'Why?' opens four blocks in order; blind spots in ≤ 15 words; legend on one line; expert closed", () => withPage(T("why"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        await openWhy(page);
        assert.deepEqual(await page.locator(".whyblock h3").allInnerTexts(), ["If a problem hits", "Who depends on whom", "Money stuck for a while", "What this tool cannot see"]);
        const blind = await page.locator(".whyblock").nth(3).locator("p").first().innerText();
        assert.equal(blind, "A hack, a technical failure, or a human decision.");
        assert.ok(countWords(blind) <= 15);
        assert.equal(norm(await page.locator(".legendline").innerText()), "Measured Modeled Your assumption Historical");
        if (vp === "1440") assert.ok((await page.locator(".legendline").boundingBox())!.height < 30, "legend on one line");
        const r = report(STEAKHOUSE), rf = readJson(`results/refine/${STEAKHOUSE}.json`);
        const c0 = r.verdictGrid.find((x: any) => x.id === r.bindingIncident).cells.find((c: any) => c.horizonDays === 30 && c.lockedHaircut === 0);
        assert.ok(norm(await page.locator(".whyblock").nth(2).innerText()).includes(`If it costs you nothing, leave only above 1 in ${Math.round(1 / c0.breakEven)}.`));
        assert.ok(norm(await page.locator(".whyblock").nth(1).innerText()).includes(`through ${rf.concentration.byMarket.n} markets`));
        assert.equal(await page.locator(".expert").count(), 0);
      }));

      test("21. the '?' (44 px) and the glossary live in 'Why?' only", () => withPage(T("qmark"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        assert.equal(await page.locator(".qbtn").count(), 0, "no '?' before 'Why?' is opened");
        await openWhy(page);
        const q = page.locator("#why").getByRole("button", { name: 'What does "vault" mean?' });
        const box = await q.boundingBox();
        assert.ok(box && box.width >= 44 && box.height >= 44, `"?" target ${JSON.stringify(box)}`);
        await q.click();
        assert.match(await page.locator("#why .qtip").innerText(), /^a pool where your money is lent out\./);
        await page.locator("#why .qtip a", { hasText: "Glossary" }).click();
        await page.locator(".glossary h1", { hasText: "Glossary" }).waitFor();
        const g = norm(await page.locator(".glossary").innerText());
        for (const s of ["vault a pool where your money is lent out", "WETH Ethereum, in token form", "cash available to withdraw (liquidity) the part of the pool's money",
          "price source (oracle) the price source the pool trusts", "break-even probability how likely a problem must be for leaving to be worth it"])
          assert.ok(g.includes(s), `glossary lacks "${s}"`);
        for (const [term] of JARGON) assert.ok(g.includes(term), `glossary does not explain "${term}"`);
      }));

      test("22. text budget: main screen ≤ 60 words, each 'Why?' block ≤ 40, no sentence over 20 words", () => withPage(T("budget"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        const main = await visibleText(page, "header.nav") + " " + await visibleText(page, ".lean");
        const counts: Record<string, number> = { main: countWords(main) };
        const sentences = [...sentencesOf(main)];
        await openWhy(page);
        const n = await page.locator(".whyblock").count();
        for (let i = 0; i < n; i++) { const t = await visibleText(page, `.whyblock >> nth=${i}`); counts[`why ${i + 1}`] = countWords(t); sentences.push(...sentencesOf(t)); }
        metrics.push({ target: tg.id, viewport: vp, words: counts });
        assert.ok(counts.main <= 60, `main screen: ${counts.main} words`);
        for (const [k, v] of Object.entries(counts)) if (k !== "main") assert.ok(v <= 40, `${k}: ${v} words`);
        const long = sentences.filter((s) => countWords(s) > 20);
        assert.deepEqual(long, [], "sentences over 20 words");
      }));

      test("23. the verdict changes with the slider (and none before it is touched)", () => withPage(T("verdict-lean"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        const r = report(STEAKHOUSE);
        const be = r.verdictGrid.find((x: any) => x.id === r.bindingIncident).cells.find((c: any) => c.horizonDays === 30 && c.lockedHaircut === 0.1).breakEven as number;
        const N = Math.round(1 / be);
        assert.equal(N, 89, "guard value");
        const be0 = r.verdictGrid.find((x: any) => x.id === r.bindingIncident).cells.find((c: any) => c.horizonDays === 30 && c.lockedHaircut === 0).breakEven as number;
        assert.equal(norm(await page.locator(".verdictL").innerText()), `The break-even is 1 in ${N} this month (1 in ${Math.round(1 / be0)} if blocked money costs nothing).`);
        assert.equal(norm(await page.locator(".guess span").innerText()), "Your guess: —");
        // the thumb sits in the middle until touched (not at the threshold)
        const rng = await page.getByRole("slider", { name: "your guess" }).evaluate((e) => { const i = e as HTMLInputElement; return [Number(i.min), Number(i.max), Number(i.value)]; });
        assert.ok(Math.abs(rng[2] - (rng[0] + rng[1]) / 2) < 0.0026, `thumb not centred: ${rng}`);
        const slider = page.getByRole("slider", { name: "your guess" });
        await slider.focus();
        await page.keyboard.press("End"); // 20 % = 1 in 5
        await page.locator(".verdictL", { hasText: `Leave: your guess 1 in 5 is above 1 in ${N} this month.` }).waitFor({ timeout: 3000 });
        await page.keyboard.press("Home"); // 0.25 % = 1 in 400
        await page.locator(".verdictL", { hasText: `Stay: your guess 1 in 400 is below 1 in ${N} this month.` }).waitFor({ timeout: 3000 });
      }));

      test("24. changing the pool changes the word and the number", () => withPage(T("switch"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        const other = "0x2371e134e3455e0593363cBF89d3b6cf53740618"; // Gauntlet WETH Prime
        const rf = readJson(`results/refine/${other}.json`), r = report(other);
        const before = [await page.locator(".bigword").innerText(), norm(await page.locator(".figure").innerText())];
        await page.locator("select[aria-label=vault]").selectOption(other);
        const run = r.runs.find((x: any) => x.id === rf.answer.worstRun.id);
        const want = `If others leave first, ${fmtUnits(run.holderExecutedExit, 18)} of your ${fmtUnits(r.target.holderValue, 18)} WETH comes out right away (${run.changePct.toFixed(2)} %).`;
        await page.locator(".figure", { hasText: fmtUnits(run.holderExecutedExit, 18) }).waitFor({ timeout: 10_000 });
        const after = [await page.locator(".bigword").innerText(), norm(await page.locator(".figure").innerText())];
        assert.deepEqual(after, [rf.answer.word, want]);
        assert.notEqual(after[0], before[0], "the word changes (Hard exit → Tight exit)");
        assert.notEqual(after[1], before[1]);
      }));

      test("27. your size: 0.5 WETH all comes out, nothing waits, Easy exit; gas weighs more so the break-even is higher", () => withPage(T("size-small"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        const r = report(STEAKHOUSE), rf = readJson(`results/refine/${STEAKHOUSE}.json`);
        const big = sizeCase(r, rf.answer.worstRun.id, BigInt(r.target.holderValue));
        const half = sizeCase(r, rf.answer.worstRun.id, parseAmount("0.5", 18)!);
        await page.getByRole("textbox", { name: "how much did you put in" }).fill("0.5");
        await page.locator(".bigword", { hasText: "Easy exit" }).waitFor({ timeout: 3000 });
        assert.equal(norm(await page.locator(".figure").innerText()), "If others leave first, 0.50 of your 0.50 WETH comes out right away (±0.00 %).");
        assert.equal(await page.locator(".wait").count(), 0, "no 'would wait' line");
        assert.equal(await page.locator(".source").first().innerText(), "Scaled from the measured case.");
        assert.equal(norm(await page.locator(".verdictL").innerText()), `The break-even is 1 in ${Math.round(1 / half.breakEven10!)} this month (1 in ${Math.round(1 / half.breakEven0!)} if blocked money costs nothing).`);
        assert.ok(half.breakEven10! > big.breakEven10!, "higher break-even for the small amount");
        assert.ok(Math.round(1 / half.breakEven10!) < 89, "shown as a smaller N (1 in 15 vs 1 in 89)");
      }));

      test("28. empty, negative, not a number, or above the measured range: a simple message, no console error", () => withPage(T("size-bad"), tg.base(), opts, async ({ page, errors }) => {
        await waitAnswer(page);
        const box = page.getByRole("textbox", { name: "how much did you put in" });
        for (const v of ["", "-3", "abc", "0"]) {
          await box.fill(v);
          await page.locator(".figure.invalid", { hasText: "Enter an amount above 0." }).waitFor({ timeout: 3000 });
        }
        await box.fill("1.1234567890123456789");
        await page.locator(".figure.invalid", { hasText: "Use at most 18 decimals." }).waitFor({ timeout: 3000 });
        await box.fill("10000");
        await page.locator(".source", { hasText: "Above the measured range: shown for 5,209.91 WETH." }).waitFor({ timeout: 3000 });
        assert.ok(norm(await page.locator(".figure").innerText()).startsWith("If others leave first, 2,079.21 of your 5,209.91 WETH"));
        assert.deepEqual(errors, []);
      }));

      test("29. optional € price: amounts also shown in euros (no default value, no network)", () => withPage(T("size-eur"), tg.base(), opts, async ({ page, requests, origin }) => {
        await waitAnswer(page);
        assert.equal(await page.getByRole("textbox", { name: "Price of 1 WETH in €" }).inputValue(), "", "empty by default");
        assert.equal(await page.locator(".eur").count(), 0);
        assert.equal(await page.locator(".pricehint").count(), 0, "hint shown when the price field is used");
        await page.getByRole("textbox", { name: "Price of 1 WETH in €" }).fill("2000");
        const r = report(STEAKHOUSE), rf = readJson(`results/refine/${STEAKHOUSE}.json`);
        const sc = sizeCase(r, rf.answer.worstRun.id, BigInt(r.target.holderValue));
        const e = (x: bigint) => (Number(x) / 1e18 * 2000).toLocaleString("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
        assert.equal(norm(await page.locator(".eur").innerText()), `${e(sc.now)} of ${e(sc.amount)}; ${e(sc.wait)} would wait`);
        assert.equal(await page.locator(".pricehint").innerText(), "Your own figure, not a market quote");
        assert.deepEqual(requests.filter((u) => !isLocal(u, origin)), []);
      }));

      test("25. Replay (static) reports the recorded replay", () => withPage(T("replaybtn"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        await page.getByRole("button", { name: "Replay", exact: true }).click();
        assert.equal(await page.locator(".runout").innerText(), `Recorded replay: ${replayFact(STEAKHOUSE).replace(" OK", "")} runs identical to the wei.`);
      }));

      test("3. Steakhouse ETH: each pill shows the executed amount; Details shows cushion and error", () => withPage(T("pills"), tg.base(), opts, async ({ page }) => {
        await waitAmount(page);
        const r = report(STEAKHOUSE);
        const guard: Record<string, string> = { "Alone": "5,209.91", "One holder before me": "4,210.68", "Two holders": "3,489.01", "Another vault": "3,318.75", "Both vaults": "2,079.21" };
        const pills = expectedPills(r);
        assert.equal(await page.locator(".pills [role=tab]").count(), pills.length);
        for (const [label, run] of pills) {
          await clickPill(page, label);
          const want = fmtUnits(run.holderExecutedExit, r.target.assetDecimals);
          await assert.doesNotReject(page.waitForFunction((w) => document.querySelector(".bignum .amount")?.textContent?.startsWith(w), want, { timeout: 3000 }), `${label}: expected ${want}, shown ${await amount(page)}`);
          assert.equal(want, guard[label], `${label}: results/ disagrees with the acceptance value`);
        }
        await clickPill(page, "One holder before me");
        await page.getByRole("button", { name: "Details", exact: true }).click();
        const box = page.locator(".detailbox").first();
        await box.waitFor();
        const text = await box.innerText();
        assert.match(text, new RegExp(`passes at ${fmtUnits(r.cushion.passesAt, 18, 3).replace(/\./g, "\\.")}`));
        assert.match(text, /1,736\.990/);
        assert.match(text, /NotEnoughLiquidity/);
        assert.match(text, /0x4323a555/);
        assert.match(text, new RegExp(INDEX.vaults.find((v) => v.vault === STEAKHOUSE)!.manifest.sha256));
      }));

      test("4. verdict: thresholds, 10 %/0 % switch, no verdict before the slider is touched", () => withPage(T("verdict"), tg.base(), opts, async ({ page }) => {
        await waitAmount(page);
        await showAll(page);
        const r = report(STEAKHOUSE);
        const g = r.verdictGrid.find((x: any) => x.id === r.bindingIncident);
        const be = (hc: number) => g.cells.find((c: any) => c.horizonDays === 30 && c.lockedHaircut === hc).breakEven as number;
        const verdict = await page.locator(".verdict2").innerText();
        for (const s of [fmtPct(be(0.1)), fmtPct(be(0)), "1.13%", "5.57%"]) assert.ok(verdict.includes(s), `verdict lacks ${s}: ${verdict}`);
        const chosen = () => page.locator(".stat.chosen .statnum").innerText();
        assert.equal(await chosen(), fmtPct(be(0.1)));
        await page.locator(".toggle [role=radio]", { hasText: /^0 %$/ }).click();
        await page.locator(".toggle [role=radio][aria-checked=true]", { hasText: /^0 %$/ }).waitFor();
        assert.equal(await chosen(), fmtPct(be(0)));
        await page.getByRole("button", { name: "Show how this is calculated" }).click();
        assert.match(await page.locator(".card .detailbox").innerText(), new RegExp(fmtPct(be(0)).replace(".", "\\.")));
        const reading = page.locator(".reading");
        assert.equal(await page.locator(".sliderval").innerText(), "—");
        assert.match(await reading.innerText(), /^Move the slider/);
        assert.doesNotMatch(await reading.innerText(), /pays off|cheaper/);
        const slider = page.getByRole("slider", { name: "your estimate" });
        for (const hc of [0, 0.1]) {
          if (hc === 0.1) { await page.locator(".toggle [role=radio]", { hasText: /^10 %$/ }).click(); await page.locator(".toggle [role=radio][aria-checked=true]", { hasText: /^10 %$/ }).waitFor(); }
          await slider.focus();
          await page.keyboard.press("Home"); // 0 %: clearly below p*
          assert.ok(0 < be(hc));
          await page.locator(".reading", { hasText: "staying is cheaper" }).waitFor({ timeout: 3000 });
          await page.keyboard.press("End"); // 30 %: clearly above p*
          assert.ok(0.3 > be(hc));
          await page.locator(".reading", { hasText: "leaving pays off" }).waitFor({ timeout: 3000 });
          assert.equal(await page.locator(".sliderval").innerText(), "30.00%");
        }
      }));

      test("5. Not modeled: total-loss thresholds match the report", () => withPage(T("notmodeled"), tg.base(), opts, async ({ page }) => {
        await waitAmount(page);
        await showAll(page);
        await page.locator("details.fold > summary").click();
        const shown = await page.locator(".threestats .statnum").allInnerTexts();
        const r = report(STEAKHOUSE);
        assert.deepEqual(shown, r.notModeled.totalLoss.map((x: any) => fmtPct(x.breakEven)));
        assert.deepEqual(shown, ["0.03%", "0.13%", "0.38%"]);
        assert.match(await page.locator("details.fold").innerText(), /The probability is yours, nothing here predicts it\./);
      }));

      test("12. history tile: k of N per shock size from results/history, no single forecast", () => withPage(T("history"), tg.base(), opts, async ({ page }) => {
        await waitAmount(page);
        await showAll(page);
        const h = readJson("results/history/steth-eth.json");
        const tile = page.locator(".histtile:not(.oct2025)");
        await tile.locator(".histtable").waitFor();
        const rows = await tile.locator(".histtable tr").allInnerTexts();
        assert.deepEqual(rows.map(norm), h.windows.bySize.map((x: any) => `${Math.round(x.size * 100)} %${x.size === 0.1 ? " (this incident)" : ""} intraday: k = ${x.k} of ${x.n} windows · daily sample: k = ${x.kDailySample}`));
        const text = norm(await tile.innerText());
        assert.ok(text.includes("One event is not a distribution. This is a reference, not a forecast."), text);
        assert.ok(text.includes("The market's oracle does not use this feed."), text);
        assert.ok(text.includes("may update only once every 24 hours when the price is calm") && text.includes("does not show prices on decentralised exchanges"), text);
        assert.ok(text.includes(`−${(h.windows.worst.drop * 100).toFixed(2)}`), "worst window from the intraday computation");
      }));

      test("13. break it down: no verdict before the second slider; p = shock × others exit, compared with p*", () => withPage(T("breakdown"), tg.base(), opts, async ({ page }) => {
        await waitAmount(page);
        await showAll(page);
        await page.getByRole("radio", { name: "break it down" }).click();
        assert.match(await page.locator(".reading").innerText(), /^Move the second slider/);
        const h = readJson("results/history/steth-eth.json");
        const ref = h.windows.bySize.find((x: any) => x.size === 0.1);
        assert.match(await page.locator(".slider2 .sliderval").first().innerText(), new RegExp(`^${ref.k} of ${ref.n} windows`));
        await page.getByRole("slider", { name: "chance that others exit first" }).focus();
        await page.keyboard.press("End"); // 100 % × reference
        const expectRef = ref.k / ref.n; // product with 100 %
        const be = report(STEAKHOUSE).verdictGrid.find((x: any) => x.id === report(STEAKHOUSE).bindingIncident).cells.find((c: any) => c.horizonDays === 30 && c.lockedHaircut === 0.1).breakEven;
        await page.locator(".reading", { hasText: expectRef > be ? "leaving pays off" : "staying is cheaper" }).waitFor({ timeout: 3000 });
        await page.getByRole("slider", { name: "chance of the shock" }).focus();
        await page.keyboard.press("End"); // 50 % × 100 % = 50 % > p*
        await page.locator(".reading", { hasText: "leaving pays off" }).waitFor({ timeout: 3000 });
        await page.keyboard.press("Home"); // 0 %
        await page.locator(".reading", { hasText: "staying is cheaper" }).waitFor({ timeout: 3000 });
      }));

      test("14. exit window, governance window and vault-level loss match results/refine", () => withPage(T("refine"), tg.base(), opts, async ({ page }) => {
        await waitAmount(page);
        await showAll(page);
        const rf = readJson(`results/refine/${STEAKHOUSE}.json`);
        assert.ok(norm(await page.locator(".exitwin").innerText()).startsWith("Exit window: Immediate"));
        await clickPill(page, "One holder before me");
        assert.match(norm(await page.locator(".exitwin").innerText()), /^Exit window: Partial: [0-9]+ % now/);
        assert.ok(norm(await page.locator(".exitwinsub").innerText()).includes(`wait ${rf.governance.timelockDays} days (timelock), and a guardian can veto them`));
        const vl = await page.locator(".vaultlevel").innerText();
        assert.ok(vl.includes(fmtPct(rf.vaultLevel.ratio)), `vault-level line lacks ${fmtPct(rf.vaultLevel.ratio)}: ${vl}`);
        assert.equal(/significant loss/.test(vl), rf.vaultLevel.ratio >= 0.01);
        // wording: economic shortfall, not realized bad debt; "significant loss" only together with "approximate"
        assert.ok(norm(vl).includes(`an economic shortfall of ${fmtPct(rf.vaultLevel.ratio)} at vault level (not realized bad debt)`), vl);
        if (/significant loss/.test(vl)) assert.match(vl, /approximate/);
        await page.locator("details.fold > summary").click();
        const nm = norm(await page.locator("details.fold").innerText());
        for (const s of ["Contract hack: total-loss threshold", "Other risk teams also avoid predicting hack probabilities; we show the threshold instead.",
          `wait ${rf.governance.timelockDays} days (timelock)`, "not the liquidity lock measured above"]) assert.ok(nm.includes(s), `Not modeled lacks "${s}"`);
      }));

      test("15. incident defined in plain words above the verdict; tags carry a letter, legend under the verdict", () => withPage(T("incidentdef"), tg.base(), opts, async ({ page }) => {
        await waitAmount(page);
        await showAll(page);
        const card = page.locator(".card.glass").first();
        const def = card.locator(".incidentdef");
        assert.equal(norm(await def.innerText()), "Incident = the stETH price drops on the market but the vault's oracle does not see it, and big holders leave first.");
        // the definition comes before the verdict sentence
        assert.ok(await def.evaluate((d) => !!(d.compareDocumentPosition(document.querySelector(".verdict2")!) & Node.DOCUMENT_POSITION_FOLLOWING)));
        const letters = await card.locator(".honest .tagletter").allInnerTexts();
        assert.deepEqual(letters, ["F", "M", "A", "H"], "legend under the verdict: one letter per kind of number");
        const tagLetters = await page.locator(".tag:not(.kind) .tagpill").evaluateAll((ps) => ps.map((p) => [p.querySelector(".tagletter")?.textContent ?? "", p.textContent!.replace(/^[A-Z]/, "")]));
        const want: Record<string, string> = { "measured on fork": "F", "modeled": "M", "your assumption": "A", "historical reference": "H" };
        for (const [l, label] of tagLetters) assert.equal(l, want[label], `tag "${label}" has letter "${l}"`);
      }));

      test("16. 'Another vault' says why: the shared market, from the graph", () => withPage(T("sharedmarket"), tg.base(), opts, async ({ page }) => {
        await waitAmount(page);
        await clickPill(page, "Another vault");
        const g = readJson(`results/discovery/${STEAKHOUSE}.json`);
        const peer = g.peers.find((p: any) => p.vault === "0x31A5684983EeE865d943A696AAC155363bA024f9");
        const shared = peer.markets.filter((pm: any) => BigInt(pm.supplyAssets) > 0n && g.markets.some((m: any) => m.id === pm.id && BigInt(m.vaultSupplyAssets) > 0n));
        assert.equal(shared.length, 1);
        assert.equal(norm(await page.locator(".shared").innerText()), "Your vault and Vault Bridge WETH both lend into the same wstETH market. If their depositor leaves, your cash runs out too.");
        await clickPill(page, "Alone");
        assert.equal(await page.locator(".shared").count(), 0, "the shared-market text belongs to the 'Another vault' scenario only");
      }));

      test("17. Oct 10, 2025 card: figures from results/history (all rounds of the window)", () => withPage(T("oct2025"), tg.base(), opts, async ({ page }) => {
        await waitAmount(page);
        await showAll(page);
        const e = readJson("results/history/steth-eth.json").events.find((x: any) => x.id === "2025-10-10");
        const t = norm(await page.locator(".oct2025").innerText());
        for (const s of [e.before.price.toFixed(6), e.min.price.toFixed(6), `${(e.dropFromBefore * 100).toFixed(2)} %`, `${e.window.roundsInWindow} feed updates`,
          "Chainlink feed reading, not a DEX price. This shows how the stETH/ETH feed moved on a day of very large liquidations; it does not say how any vault behaved."])
          assert.ok(t.includes(s), `Oct 2025 card lacks "${s}": ${t}`);
        assert.doesNotMatch(t, /validat/i, "the card must not claim the model is validated");
      }));

      test("18. rule of three under the frequency tile when k = 0, computed from N", () => withPage(T("ruleofthree"), tg.base(), opts, async ({ page }) => {
        await waitAmount(page);
        await showAll(page);
        const h = readJson("results/history/steth-eth.json");
        const row = h.windows.bySize.find((x: any) => x.size === 0.1);
        const line = page.locator(".ruleofthree");
        if (row.k !== 0) { assert.equal(await line.count(), 0); return; }
        assert.equal(norm(await line.innerText()), `0 events in ${row.n} windows does not mean zero risk: with this sample, the frequency could still be as high as about 3/${row.n} ≈ ${(300 / row.n).toFixed(1)} % of 30-day windows (rule of three, about 95 % confidence).`);
      }));

      test("7. tabs open without errors; Replay shows REPLAY OK and the manifest sha256 computed here", () => withPage(T("tabs"), tg.base(), opts, async ({ page, errors }) => {
        await waitAmount(page);
        await openTabs(page);
        const names = await page.locator(".tabs [role=tab]").allInnerTexts();
        assert.deepEqual(names, ["Dependencies", "Exits in detail", "Decision in detail", "Shocks", "Withdraw queue", "Evidence", "Replay"]);
        for (const n of names) {
          await page.locator(".tabs [role=tab]", { hasText: new RegExp(`^${n}$`) }).click();
          await page.locator(".tabs [role=tab].on", { hasText: new RegExp(`^${n}$`) }).waitFor();
          await page.locator(".deep section.panel, .deep .panel").first().waitFor();
          const sw = await page.evaluate(() => document.documentElement.scrollWidth);
          assert.ok(sw <= Number(vp), `tab ${n}: horizontal scroll (scrollWidth ${sw})`);
          // a bar that stays on screen while the page scrolls must hide what passes under it (opaque background)
          const see = await page.evaluate(() => { const cs = getComputedStyle(document.querySelector(".tabs")!); const a = cs.backgroundColor.match(/[0-9.]+/g)?.map(Number) ?? [0, 0, 0, 0]; return { position: cs.position, alpha: a.length === 4 ? a[3] : 1 }; });
          assert.ok(!['sticky', 'fixed'].includes(see.position) || see.alpha > 0.9, `tab ${n}: the tab bar stays on screen with a see-through background (${JSON.stringify(see)})`);
        }
        if (vp === "1440") {
          const rf = readJson(`results/refine/${STEAKHOUSE}.json`);
          await page.locator(".tabs [role=tab]", { hasText: /^Dependencies$/ }).click();
          const conc = norm(await page.locator(".conc").innerText());
          for (const s of [`concentration index ${rf.concentration.byMarket.hhi.toFixed(2)}, ${rf.concentration.byMarket.word}`, ...rf.utilization.markets.map((m: any) => `utilization ${(m.utilization * 100).toFixed(1)}% vs a 90 % watch level`)])
            assert.ok(conc.includes(s), `Dependencies lacks "${s}": ${conc}`);
          await page.locator(".tabs [role=tab]", { hasText: /^Shocks$/ }).click();
          const reg = norm(await page.locator(".deep section.panel").first().innerText());
          for (const x of rf.regimes.byRegime) assert.ok(reg.includes(`${x.regime} (−${Math.round(x.shockSize * 100)} %)`) && reg.includes(`${(x.exposureShare * 100).toFixed(1)}%`), `regime ${x.regime} missing: ${reg}`);
        }
        await checkReplayTab(page, STEAKHOUSE);
        assert.deepEqual(errors, []);
      }));

      if (vp === "1440") {
        test("6. all vaults: each loads, shows a number, no NaN/undefined/null, replay sha256 matches", () => withPage(T("allvaults"), tg.base(), opts, async ({ page, errors }) => {
          await waitAmount(page);
          const options = await page.locator("select[aria-label=vault] option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
          assert.deepEqual([...options].sort(), INDEX.vaults.map((v) => v.vault).sort());
          await openTabs(page);
          for (const v of options) {
            const before = errors.length;
            const r = report(v);
            await page.locator("select[aria-label=vault]").selectOption(v);
            await page.locator(".exitpanel .context", { hasText: r.target.name }).waitFor({ timeout: 15_000 });
            await waitAmount(page);
            const a = await amount(page);
            assert.match(a, /^[\d,]+\.\d{2}$/, `${r.target.name}: big number is "${a}"`);
            assert.equal(a, fmtUnits(r.runs[0].holderExecutedExit, r.target.assetDecimals), `${r.target.name}: alone`);
            if (!(await page.locator(".tabs").isVisible())) await openTabs(page);
            await checkReplayTab(page, v);
            const body = await page.evaluate(() => document.body.innerText);
            const bad = body.match(/\b(NaN|undefined|null)\b/);
            assert.equal(bad, null, `${r.target.name}: visible text contains "${bad?.[0]}" near "${bad ? body.slice(Math.max(0, bad.index! - 60), bad.index! + 30) : ""}"`);
            assert.deepEqual(errors.slice(before), [], `${r.target.name}: console errors`);
          }
        }));

        test("6b. a vault without exported result shows a clear message", () => withPage(T("unknown"), tg.base(), { ...opts, hash: "vault=0x000000000000000000000000000000000000dEaD" }, async ({ page }) => {
          const msg = page.locator("section.card.bad");
          await msg.waitFor({ timeout: 10_000 });
          assert.match(await msg.innerText(), /This vault has no exported result .* Pick another vault in the list\./);
        }));

        test("8. light/dark switch keeps contrast (axe color-contrast) and layout", () => withPage(T("themes"), tg.base(), { ...opts, reducedMotion: "reduce" }, async ({ page }) => {
          await waitAmount(page);
          await page.locator("details.fold > summary").click();
          for (const theme of ["dark", "light"]) {
            if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== theme) {
              await page.getByRole("button", { name: "switch light or dark theme" }).click();
              await page.waitForFunction((t) => document.documentElement.dataset.theme === t, theme);
            }
            // main screen, 'Why?' blocks and expert mode, all open
            await openWhy(page);
            const v = await axe(page, ["color-contrast"]);
            metrics.push({ target: tg.id, theme, contrastViolations: v });
            assert.deepEqual(v, [], `${theme}: contrast violations
${JSON.stringify(v, null, 1)}`);
            const sw = await page.evaluate(() => document.documentElement.scrollWidth);
            assert.ok(sw <= 1440, `${theme}: horizontal overflow ${sw}`);
            assert.ok(await page.locator(".bignum .amount").isVisible());
          }
        }));

        test("10. reduced motion: the background is a still image", () => withPage(T("motion"), tg.base(), { ...opts, reducedMotion: "reduce" }, async ({ page }) => {
          await waitAmount(page);
          assert.equal(await page.evaluate(() => window.__epFps), 0);
          assert.equal(await canvasChanges(page), false, "canvas changed with prefers-reduced-motion");
        }));

        test("10b. control: without reduced motion the background does move", () => withPage(T("motion-control"), tg.base(), opts, async ({ page }) => {
          await waitAmount(page);
          assert.equal(await canvasChanges(page), true, "canvas did not change: the measurement would prove nothing");
        }));

        test("11. keyboard reaches the pills and the slider with a visible focus; controls have names", () => withPage(T("keyboard"), tg.base(), { ...opts, reducedMotion: "reduce" }, async ({ page }) => {
          await waitAmount(page);
          const tabTo = async (selector: string, max = 80) => {
            for (let i = 0; i < max; i++) {
              await page.keyboard.press("Tab");
              const st = await page.evaluate((s) => {
                const a = document.activeElement as HTMLElement | null;
                if (!a || !a.matches(s)) return null;
                const cs = getComputedStyle(a);
                return { visible: a.matches(":focus-visible") && cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0, text: a.textContent };
              }, selector);
              if (st) return st;
            }
            throw new Error(`${selector} not reached with ${max} Tab presses`);
          };
          // main screen with the keyboard only: pool selector → slider (verdict updates) → 'Why?'
          const sel = await tabTo("select[aria-label=vault]");
          assert.ok(sel.visible, "focus ring not visible on the pool selector");
          const s = await tabTo("input[type=range]");
          assert.ok(s.visible, "focus ring not visible on the slider");
          await page.keyboard.press("End");
          await page.locator(".verdictL", { hasText: "Leave: your guess" }).waitFor({ timeout: 3000 });
          const w2 = await tabTo(".actions .ghostpill");
          assert.ok(w2.visible, "focus ring not visible on 'Why?'");
          await page.keyboard.press("Enter");
          await page.locator("#why").waitFor();
          await waitAmount(page);
          await openTabs(page);
          const v = await axe(page, ["button-name", "link-name", "label", "select-name", "aria-valid-attr", "aria-allowed-attr", "aria-required-children", "aria-required-parent"]);
          assert.deepEqual(v, [], JSON.stringify(v, null, 1));
        }));
      }

      if (vp === "375") {
        test("26. the main screen fits 375×667 without scrolling", () => withPage(T("fit667"), tg.base(), { ...opts, viewport: { width: 375, height: 667 } }, async ({ page }) => {
          await waitAnswer(page);
          const boxes = await page.evaluate(() => ["select[aria-label=vault]", ".amount-row", ".bigword", ".figure", ".leanbar", ".verdictL", ".guess", ".actions"].map((s) => { const b = document.querySelector(s)!.getBoundingClientRect(); return { s, top: Math.round(b.top), bottom: Math.round(b.bottom) }; }));
          const nav = await page.locator("header.nav").boundingBox();
          const out = boxes.filter((b) => b.bottom > 667 || b.top < (nav ? nav.y + nav.height : 0));
          assert.deepEqual(out, [], `outside the first 667 px or under the top bar: ${JSON.stringify(boxes)}`);
          assert.equal(await page.evaluate(() => scrollY), 0);
        }));

        test("9. mobile: no horizontal scroll, running text ≥ 16 px, tap targets ≥ 44 px, readable hero", () => withPage(T("mobile"), tg.base(), opts, async ({ page }) => {
          await waitAnswer(page);
          const SMALL_TEXT = ".lean p, .lean .guess span, .lean .amt span, .lean .unit, .whyblock p, .whyblock h3";
          const TARGETS = ".lean button, .lean select, .lean input, .qbtn, .whyblock .tagbtn, header button, header a, .expertbar button";
          const issues: unknown[] = [];
          for (const stage of ["main", "why"]) {
            if (stage === "why") await openWhy(page);
            const r = await page.evaluate(([ts, tg]) => ({
              small: [...document.querySelectorAll<HTMLElement>(ts)].filter((e) => e.offsetParent !== null && e.innerText.trim() && parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => `${e.className}: ${e.innerText.slice(0, 30)}`),
              targets: [...document.querySelectorAll<HTMLElement>(tg)].filter((e) => e.offsetParent !== null).map((e) => { const b = e.getBoundingClientRect(); return { t: (e.innerText || e.getAttribute("aria-label") || "").slice(0, 30), w: Math.round(b.width), h: Math.round(b.height) }; }).filter((x) => x.w < 44 || x.h < 44),
              sw: document.documentElement.scrollWidth,
            }), [SMALL_TEXT, TARGETS]);
            if (r.small.length || r.targets.length || r.sw > 375) issues.push({ stage, ...r });
          }
          assert.deepEqual(issues, [], JSON.stringify(issues, null, 1));
          await waitAmount(page);
          assert.equal(await page.locator(".expertfacts").evaluate((e) => getComputedStyle(e).gridTemplateColumns.split(" ").length), 2, "facts are not a 2×2 grid");
          await showAll(page);
          await page.locator("details.fold > summary").click();
          await page.getByRole("button", { name: "Details", exact: true }).click();
          await openTabs(page);
          const sw = await page.evaluate(() => document.documentElement.scrollWidth);
          assert.ok(sw <= 375, `horizontal scroll: scrollWidth ${sw}`);
          // running text = sentences meant to be read; labels, tag pills, footnotes in .small and hashes are captions
          const small = await page.evaluate(() => {
            const sel = ".sub2, .facts dd, .context, .plain, .detailbox p:not(.small):not(.mono), .verdict2, .verdict2sub, .honest .hitem, .statsub, .reading, details.fold > p, .modeline";
            return [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => e.offsetParent !== null && e.innerText.trim())
              .map((e) => ({ sel: e.className || e.tagName, size: parseFloat(getComputedStyle(e).fontSize), text: e.innerText.slice(0, 40) })).filter((x) => x.size < 16);
          });
          const targetsTooSmall = await page.evaluate(() => {
            const sel = "header button, header a, .hero button, .controls select, .controls input, .exitpanel button, .card > button, .card .stat, .toggle button, .card input[type=range], details.fold > summary, .reveal button, .tabs button";
            return [...document.querySelectorAll<HTMLElement>(sel)].filter((e) => e.offsetParent !== null)
              .map((e) => { const r = e.getBoundingClientRect(); return { el: `${e.tagName.toLowerCase()}.${e.className}`, text: (e.innerText || e.getAttribute("aria-label") || "").slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; })
              .filter((x) => x.w < 44 || x.h < 44);
          });
          assert.deepEqual({ small, targetsTooSmall }, { small: [], targetsTooSmall: [] }, `running text under 16 px / tap targets under 44 px:
${JSON.stringify({ small, targetsTooSmall }, null, 1)}`);
          const navWrapped = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>("header.nav > *")].filter((e) => e.offsetParent !== null && e.getBoundingClientRect().height > 50).map((e) => e.innerText));
          assert.deepEqual(navWrapped, [], `top bar items wrap on two lines: ${navWrapped.join(" | ")}`);
          // text must not be hidden under the tag pills placed on the tiles
          const overlaps = await page.evaluate(() => [...document.querySelectorAll(".statwrap")].flatMap((w) => {
            const t = w.querySelector(".tagpill")!.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(w.querySelector(".statlabel")!);
            return [...range.getClientRects()].filter((r) => r.right > t.left && r.left < t.right && r.bottom > t.top && r.top < t.bottom)
              .map(() => w.querySelector(".statlabel")!.textContent);
          }));
          assert.deepEqual(overlaps, [], `tile label hidden under its tag: ${overlaps.join(" | ")}`);
          const deep = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>(".deep .panel button, .deep .panel a")].filter((e) => e.offsetParent !== null && e.getBoundingClientRect().height < 44).length);
          if (deep) warnings.push(`${tg.id} 375px: ${deep} controls inside the expert tabs are under 44 px (not part of the opening flow; not failed)`);
        }));
      }
    });
  }
}

async function openTabs(page: Page) {
  await showAll(page);
  const b = page.getByRole("button", { name: "See the dependencies and the proof" });
  if (await b.isVisible()) await b.click();
  await page.locator(".tabs").waitFor();
}
async function checkReplayTab(page: Page, v: string) {
  await page.locator(".tabs [role=tab]", { hasText: /^Replay$/ }).click();
  const kv = page.locator(".kv");
  await kv.waitFor();
  const text = await kv.innerText();
  const m = JSON.parse(readFileSync(join(ROOT, `results/manifests/${v}.json`), "utf8"));
  const computed = manifestHash(m);
  assert.equal(computed, m.sha256, `${v}: manifest file does not hash to its recorded sha256`);
  assert.ok(text.includes(computed), `${v}: Replay tab does not show sha256 ${computed}`);
  assert.match(text, /REPLAY OK/, `${v}: Replay tab does not say REPLAY OK`);
}
/** does the canvas change during a 700 ms measurement window? */
async function canvasChanges(page: Page) {
  return page.evaluate(async () => {
    const c = document.querySelector<HTMLCanvasElement>("canvas.waves")!;
    const a = c.toDataURL();
    await new Promise((r) => setTimeout(r, 700)); // measurement window, not a synchronisation wait
    return c.toDataURL() !== a;
  });
}

// ---------- B: live mode ----------
async function liveStatus() {
  try {
    const r = await fetch(new URL("/api/status", LIVE_URL), { signal: AbortSignal.timeout(3000) });
    const j: any = await r.json();
    return { up: !!j.fork && j.fork.head === j.fork.sourceBlock, j };
  } catch { return { up: false, j: null }; }
}
if (!EXTERNAL) {
  describe("live (npm run demo)", async () => {
    const st = await liveStatus();
    const skip = st.up ? false : `live stack not running at ${LIVE_URL} (start it with npm run demo); live checks skipped`;
    if (skip) console.log(`# SKIP ${skip}`);

    test("B1. badge 'live fork' and executing again on the fork is identical to the wei", { skip }, () => withPage("live-execute", LIVE_URL, DESKTOP, async ({ page, errors }) => {
      await page.locator(".modebadge", { hasText: "live fork" }).waitFor({ timeout: 10_000 });
      await waitAmount(page);
      await clickPill(page, "Another vault");
      await page.getByRole("button", { name: "Details", exact: true }).click();
      const run = page.getByRole("button", { name: "Execute this again on the fork" });
      assert.ok(await run.isEnabled(), "execute button disabled in live mode");
      await run.click();
      const out = page.locator(".detailbox p.mono", { hasText: /identical to the wei|DIFFERENT|Error|error/ });
      await out.waitFor({ timeout: 180_000 });
      const text = await out.innerText();
      metrics.push({ live: "execute again", result: text });
      const r = report(STEAKHOUSE);
      const other = expectedPills(r).find(([l]) => l === "Another vault")![1];
      assert.equal(text.replace(/ in \d+ ms/, ""), `${fmtUnits(other.holderExecutedExit, r.target.assetDecimals, 6)} WETH — identical to the wei`);
      assert.deepEqual(errors, []);
    }));

    test("B5. 'Run the exit' at your size: you play the largest position, the worst case replayed, the fork reset (second run identical to the wei)", { skip }, () => withPage("live-run", LIVE_URL, DESKTOP, async ({ page, errors }) => {
      await page.locator(".modebadge", { hasText: "live fork" }).waitFor({ timeout: 10_000 });
      await waitAnswer(page);
      await page.getByRole("textbox", { name: "how much did you put in" }).fill("100");
      const runOnce = async () => {
        const resp = page.waitForResponse((x) => x.url().includes("/api/size"), { timeout: 180_000 });
        await page.getByRole("button", { name: "Run the exit" }).click();
        const j = await (await resp).json();
        await page.locator(".source", { hasText: "Simulated on the fork, just now." }).waitFor({ timeout: 10_000 });
        return j;
      };
      const a = await runOnce();
      const b = await runOnce();
      metrics.push({ live: "your size 100 WETH", first: a.exitNow, second: b.exitNow, gasExit: a.gasUsed.exit });
      assert.equal(a.exitNow, "100000000000000000000", "exactly the amount: withdrawn from the existing position, no interest drift");
      assert.equal(a.exitNow, b.exitNow, "the fork is back to its base state between runs");
      assert.equal(a.gasUsed.exit, b.gasUsed.exit);
      assert.ok(norm(await page.locator(".figure").innerText()).startsWith(`If others leave first, ${fmtUnits(a.exitNow, 18)} of your 100.00 WETH`));
      assert.deepEqual(errors, []);
    }));

    test("B7. at the largest position, live and static give the same word and the same number; budget and 375×667 fit hold", { skip }, () => withPage("live-same", LIVE_URL, { ...MOBILE, viewport: { width: 375, height: 667 } }, async ({ page }) => {
      await waitAnswer(page);
      const read = async () => [await page.locator(".bigword").innerText(), norm(await page.locator(".figure").innerText()), norm(await page.locator(".wait").innerText())];
      const scaled = await read();
      assert.equal(await page.locator(".source").first().innerText(), "Scaled from the measured case.");
      const resp = page.waitForResponse((x) => x.url().includes("/api/size"), { timeout: 180_000 });
      await page.getByRole("button", { name: "Run the exit" }).click();
      const j = await (await resp).json();
      await page.locator(".source", { hasText: "Simulated on the fork, just now." }).waitFor({ timeout: 10_000 });
      const r = report(STEAKHOUSE);
      assert.equal(j.exitNow, r.runs.find((x: any) => x.id === "B_both_vaults").holderExecutedExit, "exactly the measured 2,079.21 (to the wei)");
      const simulated = await read();
      assert.deepEqual(simulated, scaled, "same word, same number, same wait line");
      assert.deepEqual(scaled, ["Hard exit", "If others leave first, 2,079.21 of your 5,209.91 WETH comes out right away (-60.09 %).", "3,130.70 WETH would wait."]);
      assert.equal(await page.getByText("New money adds cash").count(), 0);
      const words = countWords(await visibleText(page, "header.nav") + " " + await visibleText(page, ".lean"));
      metrics.push({ live: "words after a run at 5,209.91", words });
      assert.ok(words <= 60, `${words} words`);
      const bottom = await page.evaluate(() => document.querySelector(".actions")!.getBoundingClientRect().bottom);
      assert.ok(bottom <= 667, `actions bottom at ${bottom}`);
    }));

    test("B6. fork not reachable: the main screen falls back to the scaled case with a plain message", { skip }, () => withPage("live-size-down", LIVE_URL, DESKTOP, async ({ page, errors }) => {
      await page.locator(".modebadge", { hasText: "live fork" }).waitFor({ timeout: 10_000 });
      await waitAnswer(page);
      await page.route("**/api/size", (r) => r.abort());
      await page.getByRole("button", { name: "Run the exit" }).click();
      await page.locator(".runout", { hasText: "Fork not reachable: scaled from the measured case." }).waitFor({ timeout: 10_000 });
      assert.equal(await page.locator(".source").first().innerText(), "Scaled from the measured case.");
      assert.ok(norm(await page.locator(".figure").innerText()).startsWith("If others leave first, 2,079.21 of your 5,209.91 WETH"));
      assert.deepEqual(errors.filter((e) => !/Failed to load resource|ERR_FAILED/.test(e)), []);
    }));

    test("B2. analyzing a non-V1 address is refused with a clear reason", { skip }, () => withPage("live-refuse", LIVE_URL, DESKTOP, async ({ page }) => {
      await waitAmount(page);
      await openTabs(page);
      await page.getByRole("textbox", { name: "vault address" }).fill("0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"); // WETH token
      await page.getByRole("button", { name: "Analyze" }).click();
      const msg = page.locator(".analyze .status.bad");
      await msg.waitFor({ timeout: 120_000 });
      assert.match(await msg.innerText(), /not a MetaMorpho V1\.0\/V1\.1 vault/);
    }));

    test("B3. fork stops answering (simulated: /api/status blocked) → static replay with a visible banner", { skip }, () => withPage("live-fallback", LIVE_URL, DESKTOP, async ({ page, errors }) => {
      await page.locator(".modebadge", { hasText: "live fork" }).waitFor({ timeout: 10_000 });
      await waitAmount(page);
      await page.route("**/api/status", (r) => r.abort());
      await page.locator(".modeline .fallback", { hasText: "stopped answering" }).waitFor({ timeout: 30_000 });
      await page.locator(".modebadge", { hasText: "replay · offline" }).waitFor();
      await waitAmount(page);
      assert.match(await amount(page), /^[\d,]+\.\d{2}$/);
      assert.deepEqual(errors.filter((e) => !/Failed to load resource|ERR_FAILED/.test(e)), []);
    }));

    // A real kill: the demo supervisor restarts the fork in ~8 s, about the page's own polling period, so the
    // fallback banner cannot be forced this way (B3 covers it). What is checked: an action during the outage
    // fails with a readable message and no crash, and after the restart the same exit is identical to the wei.
    test("B4. real fork process killed: readable message during the outage; after restart, banner + static replay or identical to the wei", { skip: skip || (process.env.E2E_KILL_FORK === "1" ? false : "opt-in: E2E_KILL_FORK=1 (kills the fork process; data untouched)") }, () => withPage("live-kill", LIVE_URL, DESKTOP, async ({ page, errors }) => {
      await page.locator(".modebadge", { hasText: "live fork" }).waitFor({ timeout: 10_000 });
      await waitAmount(page);
      await clickPill(page, "Another vault");
      await page.getByRole("button", { name: "Details", exact: true }).click();
      const line = execSync("netstat -ano -p TCP", { encoding: "utf8" }).split("\n").find((l) => /127\.0\.0\.1:8545\s+\S+\s+LISTENING/.test(l));
      assert.ok(line, "no process listening on 127.0.0.1:8545");
      execSync(`taskkill /PID ${line!.trim().split(/\s+/).pop()} /T /F`, { stdio: "ignore" });
      const t0 = Date.now();
      const run = page.getByRole("button", { name: "Execute this again on the fork" });
      const out = page.locator(".detailbox p.mono", { hasNot: page.locator("text=manifest sha256") }).last();
      if (await run.isVisible() && await run.isEnabled()) {
        await run.click();
        await page.waitForFunction(() => { const t = [...document.querySelectorAll(".detailbox p.mono")].pop()?.textContent ?? ""; return t && !t.includes("executing") && !t.includes("manifest sha256"); }, null, { timeout: 120_000 });
        metrics.push({ live: "execute during fork outage", shown: await out.innerText() });
        assert.match(await out.innerText(), /identical to the wei|did not answer: it is stopped or restarting/, "unreadable message during the outage");
      }
      for (;;) { // event: the status endpoint reports the fork back at the source block
        if ((await liveStatus()).up) break;
        if (Date.now() - t0 > 180_000) throw new Error("fork not restarted by the demo supervisor after 180 s: run npm run demo again");
        await new Promise((r) => setTimeout(r, 1000));
      }
      const restartedAfterMs = Date.now() - t0;
      // whether the page's 8 s status poll saw the outage depends on timing; both outcomes are checked
      const banner = await page.locator(".modeline .fallback").isVisible();
      metrics.push({ live: "fork killed", restartedAfterMs, bannerSeen: banner });
      assert.ok(await page.locator(".bignum .amount").isVisible(), "page lost its content");
      assert.deepEqual(errors.filter((e) => !/Failed to load resource|ERR_|HTTP 5\d\d/.test(e)), []);
      if (banner) {
        await page.locator(".modebadge", { hasText: "replay · offline" }).waitFor();
        assert.match(await page.locator(".modeline .fallback").innerText(), /stopped answering .* switched to the static replay/);
      } else {
        await run.click();
        await page.locator(".detailbox p.mono", { hasText: "identical to the wei" }).waitFor({ timeout: 180_000 });
      }
    }));
  });
}
