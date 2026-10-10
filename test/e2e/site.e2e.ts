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
const waitAnswer = (page: Page) => page.locator(".answer .word").waitFor({ state: "visible", timeout: 15_000 });
/** expert mode is closed by default: open it, then wait for the executed amount */
async function waitAmount(page: Page) {
  await page.locator(".answer .word, section.card.bad").first().waitFor({ timeout: 15_000 });
  const b = page.getByRole("button", { name: /^Expert mode/ });
  if (await b.isVisible()) await b.click();
  await page.locator(".bignum .amount").waitFor({ state: "visible", timeout: 15_000 });
}
const openStep = async (page: Page, n: number) => { await page.locator(".stepbtn").nth(n - 1).click(); await page.locator(`#step-${n}`).waitFor(); };
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
        // walk the three steps and expert mode: still no request leaving the machine, and no /api/ call in static mode
        for (const n of [1, 2, 3]) await openStep(page, n);
        await waitAmount(page);
        const external = requests.filter((u) => !isLocal(u, origin));
        assert.deepEqual(external, [], `external requests:\n${external.join("\n")}`);
        assert.deepEqual(requests.filter((u) => /\/api\//.test(u)), [], "the static site called the local API");
        assert.deepEqual(errors, []);
      }));

      test("2. hero: one question, one-word answer from results/refine, See why; facts in expert mode", () => withPage(T("hero"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        const rf = readJson(`results/refine/${STEAKHOUSE}.json`);
        assert.equal(norm(await visibleText(page, ".hero h1")), "Can I get my money back out of this vault if something goes wrong?");
        assert.equal(await page.locator(".answer .word").innerText(), rf.answer.word);
        assert.ok(["Easy exit", "Tight exit", "Hard exit"].includes(rf.answer.word));
        assert.match(await page.locator(".answer").getAttribute("class") ?? "", new RegExp(`w-${rf.answer.level}`));
        assert.ok(norm(await page.locator(".answertext").innerText()).includes(`If many people leave at once, about ${Math.round(rf.answer.worstShare * 100)} % of this position could get out`));
        assert.equal(norm(await page.locator(".answernote").innerText()), "This is about how easily you can leave, not whether you should. The advice is below.");
        // the word speaks about the exit only: no advice word above the fold
        assert.doesNotMatch(await visibleText(page, ".hero"), /Safe|Careful|Risky/);
        assert.equal(await page.locator(".hero button.pill").count(), 1, "one button in the hero");
        // the hero stays dark in both themes: its "?" marks must stay light (axe ignores a lone "?")
        for (const theme of ["dark", "light"]) {
          if ((await page.evaluate(() => document.documentElement.dataset.theme)) !== theme) {
            await page.getByRole("button", { name: "switch light or dark theme" }).click();
            await page.waitForFunction((t) => document.documentElement.dataset.theme === t, theme);
          }
          const dark = await page.locator(".hero .qbtn span, .hero .infodot").evaluateAll((es) => es.filter((e) => { const m = getComputedStyle(e).color.match(/[0-9.]+/g)!.map(Number); return (m[0] + m[1] + m[2]) / 3 < 128; }).length);
          assert.equal(dark, 0, `${theme}: a "?" in the hero is dark on the dark hero`);
        }
        await page.getByRole("button", { name: "See why" }).click();
        await page.locator("#step-1").waitFor();
        // the steps come into view (the page may be too short below them for #app to reach the very top)
        await page.waitForFunction(() => { const b = document.getElementById("step-1")!.getBoundingClientRect(); return b.top >= 0 && b.top < innerHeight / 2; }, null, { timeout: 5000 });
        await waitAmount(page);
        const facts = await page.locator(".expertfacts > div").evaluateAll((ds) => ds.map((d) => [d.querySelector("dt")!.textContent, d.querySelector("dd")!.textContent]));
        const entry = INDEX.vaults.find((v) => v.vault === STEAKHOUSE)!;
        const manifest = readJson(`results/manifests/${STEAKHOUSE}.json`);
        assert.equal(manifest.sha256, entry.manifest.sha256, "index and manifest agree");
        assert.deepEqual(facts, [
          ["Measured on", `a fork of Ethereum, block ${Number(INDEX.source.block).toLocaleString("en-US")}`],
          ["Replayable", replayFact(STEAKHOUSE).endsWith("OK") ? "to the wei" : "replay failed"],
          // scope stated; "all N vaults" only if every replay in the index and in results/replays is OK
          ["Replay", `${replayFact(STEAKHOUSE)} for this vault${allReplayedOk() ? `all ${INDEX.vaults.length} vaults replayed OK` : ""}`],
          ["Coverage", `${readdirSync(join(ROOT, "results/manifests")).length} Morpho vaults`],
        ]);
        assert.equal(INDEX.vaults.length, readdirSync(join(ROOT, "results/manifests")).length);
      }));

      test("19. jargon: the first screen and each step use none of the technical terms", () => withPage(T("jargon"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        const hero = await visibleText(page, ".hero");
        assert.deepEqual(jargonIn(hero), [], `hero: ${hero}`);
        assert.doesNotMatch(hero, /\bWETH\b/, "no WETH above the fold");
        const seen: string[] = [];
        for (const n of [1, 2, 3]) {
          await openStep(page, n);
          if (n === 2) for (const label of ["Alone", "One holder before me", "Two holders", "Another vault", "Both vaults"]) {
            await page.locator(".npills [role=tab]", { hasText: new RegExp(`^${label}$`) }).click();
            if (label === "Another vault") await page.getByRole("button", { name: "Show more" }).click();
            const t = await visibleText(page, ".steps");
            for (const j of jargonIn(t)) seen.push(`step 2 / ${label}: ${j}`);
          }
          const t = await visibleText(page, ".steps");
          for (const j of jargonIn(t)) seen.push(`step ${n}: ${j}`);
        }
        assert.deepEqual(seen, []);
        assert.equal(await page.locator(".expert").count(), 0, "expert mode closed by default");
      }));

      test("20. three numbered steps, one open at a time, Next/Back; expert mode closed by default", () => withPage(T("steps"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        assert.deepEqual((await page.locator(".stepbtn").allInnerTexts()).map(norm), ["1 What you put in", "2 What could go wrong", "3 Stay or leave"]);
        assert.equal(await page.locator(".nbox").count(), 1);
        assert.equal(await page.locator(".stepbtn[aria-current=step]").innerText().then(norm), "1 What you put in");
        await page.locator("#step-1").getByRole("button", { name: "Next" }).click();
        await page.locator("#step-2").waitFor();
        assert.equal(await page.locator(".nbox").count(), 1);
        await page.locator("#step-2").getByRole("button", { name: "Next" }).click();
        await page.locator("#step-3").waitFor();
        await page.locator("#step-3").getByRole("button", { name: "Back" }).click();
        await page.locator("#step-2").waitFor();
        assert.equal(await page.locator(".expert").count(), 0);
        const b = page.getByRole("button", { name: /^Expert mode/ });
        assert.equal(await b.getAttribute("aria-expanded"), "false");
      }));

      test("21. the '?' explains a word in plain language (44 px target) and the glossary lists every term", () => withPage(T("qmark"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        const q = page.locator(".hero").getByRole("button", { name: 'What does "vault" mean?' });
        const box = await q.boundingBox();
        assert.ok(box && box.width >= 44 && box.height >= 44, `"?" target ${JSON.stringify(box)}`);
        await q.click();
        assert.match(await page.locator(".hero .qtip").innerText(), /^a pool where your money is lent out\./);
        await openStep(page, 1);
        await page.getByRole("button", { name: 'What does "WETH" mean?' }).click();
        assert.match(await page.locator("#step-1 .qtip").innerText(), /^Ethereum, in token form\./);
        await openStep(page, 3);
        await page.getByRole("button", { name: 'What does "break-even probability" mean?' }).click();
        assert.match(await page.locator("#step-3 .qtip").innerText(), /^how likely a problem must be for leaving to be worth it\./);
        await page.locator("#step-3 .qtip a", { hasText: "Glossary" }).click();
        await page.locator(".glossary h1", { hasText: "Glossary" }).waitFor();
        const g = norm(await page.locator(".glossary").innerText());
        for (const s of ["vault a pool where your money is lent out", "WETH Ethereum, in token form", "cash available to withdraw (liquidity) the part of the pool's money",
          "price source (oracle) the price source the pool trusts", "break-even probability how likely a problem must be for leaving to be worth it"])
          assert.ok(g.includes(s), `glossary lacks "${s}"`);
        for (const [term] of JARGON) assert.ok(g.includes(term), `glossary does not explain "${term}"`);
      }));

      test("22. scaled example: per 1,000 from the measured amounts, for every scenario", () => withPage(T("scaled"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        await openStep(page, 2);
        const r = report(STEAKHOUSE);
        for (const [label, run] of expectedPills(r)) {
          await page.locator(".npills [role=tab]", { hasText: new RegExp(`^${label}$`) }).click();
          const per = Number((BigInt(run.holderExecutedExit) * 100000n) / BigInt(r.target.holderValue)) / 100;
          const ex = norm(await page.locator(".example").innerText());
          assert.ok(ex.includes(`Out of every 1,000 WETH in this position, about ${Math.round(per).toLocaleString("en-US")} WETH could come out right away in this scenario.`), `${label}: ${ex}`);
          assert.ok(ex.includes(`Scaled from the measured case: ${fmtUnits(run.holderExecutedExit, 18)} of ${fmtUnits(r.target.holderValue, 18)} WETH`), `${label}: ${ex}`);
        }
        await page.locator(".npills [role=tab]", { hasText: /^Another vault$/ }).click();
        assert.equal(norm(await page.locator(".othershort p").first().innerText()), "Another pool lends to the same borrowers. When its biggest depositor leaves, your cash runs out too.");
        assert.equal(await page.locator(".othershort p").count(), 1, "the detail stays behind Show more");
      }));

      test("23. verdict in two lines without 'probability' first, the 10 % and 0 % cases, and what the tool cannot see", () => withPage(T("novice-verdict"), tg.base(), opts, async ({ page }) => {
        await waitAnswer(page);
        await openStep(page, 3);
        const r = report(STEAKHOUSE);
        const g = r.verdictGrid.find((x: any) => x.id === r.bindingIncident);
        const be = (hc: number) => g.cells.find((c: any) => c.horizonDays === 30 && c.lockedHaircut === hc).breakEven as number;
        const line1 = norm(await page.locator(".verdictN").innerText());
        assert.equal(line1, `Stay, unless you think this problem is more likely than about 1 in ${Math.round(1 / be(0.1))} over the next month.`);
        assert.ok(norm(await page.locator(".verdictWhy").innerText()).startsWith("Why:"));
        assert.doesNotMatch(line1, /^probability/i);
        assert.deepEqual((await page.locator("#step-3 .statnum").allInnerTexts()).map(norm), [`1 in ${Math.round(1 / be(0.1))}`, `1 in ${Math.round(1 / be(0))}`]);
        assert.match(await page.locator(".reading").innerText(), /^Move the slider/);
        const cannot = norm(await page.locator(".cannot").innerText());
        assert.ok(cannot.startsWith("What this tool cannot see A hack, a technical failure, or a human decision."), cannot);
        assert.deepEqual((await page.locator(".legendN .tagpill").allInnerTexts()).map(norm), ["Measured", "Modeled", "Your assumption", "Historical"]);
        await page.getByRole("slider", { name: "your estimate of the chance" }).focus();
        await page.keyboard.press("End");
        await page.locator(".reading", { hasText: "leaving is worth it either way" }).waitFor({ timeout: 3000 });
        await page.keyboard.press("Home");
        await page.locator(".reading", { hasText: "staying is cheaper either way" }).waitFor({ timeout: 3000 });
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
            // every step of the newcomer view, with expert mode open below it
            for (const n of [1, 2, 3]) {
              await openStep(page, n);
              const v = await axe(page, ["color-contrast"]);
              metrics.push({ target: tg.id, theme, step: n, contrastViolations: v });
              assert.deepEqual(v, [], `${theme}, step ${n}: contrast violations\n${JSON.stringify(v, null, 1)}`);
            }
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
          // newcomer path with the keyboard only: step 2 → a scenario pill → Next → the slider of step 3
          const st = await tabTo(".stepbtn");
          assert.ok(st.visible, "focus ring not visible on the step buttons");
          await page.keyboard.press("Tab");
          await page.keyboard.press("Enter");
          await page.locator("#step-2").waitFor();
          const p = await tabTo(".npills [role=tab]");
          assert.ok(p.visible, "focus ring not visible on the pill");
          await page.keyboard.press("Enter");
          await tabTo("#step-2 .stepnav .pill.primary");
          await page.keyboard.press("Enter");
          await page.locator("#step-3").waitFor();
          const s = await tabTo("input[type=range]");
          assert.ok(s.visible, "focus ring not visible on the slider");
          await page.keyboard.press("End");
          await page.locator(".reading", { hasText: "leaving is worth it either way" }).waitFor({ timeout: 3000 });
          await waitAmount(page);
          await openTabs(page);
          const v = await axe(page, ["button-name", "link-name", "label", "select-name", "aria-valid-attr", "aria-allowed-attr", "aria-required-children", "aria-required-parent"]);
          assert.deepEqual(v, [], JSON.stringify(v, null, 1));
        }));
      }

      if (vp === "375") {
        test("9. mobile: no horizontal scroll, running text ≥ 16 px, tap targets ≥ 44 px, readable hero", () => withPage(T("mobile"), tg.base(), opts, async ({ page }) => {
          await waitAnswer(page);
          const h1 = await page.locator(".hero h1").boundingBox();
          assert.ok(h1 && h1.x >= 0 && h1.x + h1.width <= 375 && h1.y >= 0 && h1.y + h1.height <= 812, `hero title outside the screen: ${JSON.stringify(h1)}`);
          const why = await page.getByRole("button", { name: "See why" }).boundingBox();
          assert.ok(why && why.y + why.height <= 812, "the answer and 'See why' fit on the first screen");
          // each step of the newcomer view at 375 px
          const SMALL_TEXT = ".answertext, .answerfor, .nbox p:not(.tip), .exline, .plain2, .verdictN, .verdictWhy, .stepbtn, .legendN";
          const TARGETS = ".stepbtn, .npills button, .nbox .pill, .qbtn, .nbox .tagbtn, .hero button, header button, header a";
          const stepIssues: unknown[] = [];
          for (const n of [1, 2, 3]) {
            await openStep(page, n);
            const r = await page.evaluate(([ts, tg]) => ({
              small: [...document.querySelectorAll<HTMLElement>(ts)].filter((e) => e.offsetParent !== null && e.innerText.trim() && parseFloat(getComputedStyle(e).fontSize) < 16).map((e) => `${e.className}: ${e.innerText.slice(0, 30)}`),
              targets: [...document.querySelectorAll<HTMLElement>(tg)].filter((e) => e.offsetParent !== null).map((e) => { const b = e.getBoundingClientRect(); return { t: (e.innerText || e.getAttribute("aria-label") || "").slice(0, 30), w: Math.round(b.width), h: Math.round(b.height) }; }).filter((x) => x.w < 44 || x.h < 44),
              sw: document.documentElement.scrollWidth,
            }), [SMALL_TEXT, TARGETS]);
            if (r.small.length || r.targets.length || r.sw > 375) stepIssues.push({ step: n, ...r });
          }
          assert.deepEqual(stepIssues, [], JSON.stringify(stepIssues, null, 1));
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
