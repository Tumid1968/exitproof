// Screenshot + network audit through the Chrome DevTools Protocol (device emulation down to 375 px).
// Usage: node scripts/shoot.mjs <url> <out.png> [width=375] [height=812] [mobile=1] [dark|light] [clickSelector|…] [scrollTo: px or #id]
// Prints every request the page makes; exits 2 if one leaves the machine (not file:// or 127.0.0.1).
import { spawn } from "node:child_process";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, out, w = "375", h = "812", mobile = "1", scheme = "dark", click = "", scroll = ""] = process.argv.slice(2);
const CHROME = process.env.CHROME ?? "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9300 + Math.floor(Math.random() * 500);
const profile = mkdtempSync(join(tmpdir(), "ep-shot-"));
const chrome = spawn(CHROME, ["--headless=new", "--disable-gpu", `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let targets;
for (let i = 0; i < 50; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch { /* starting */ } await sleep(200); }
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r));
let id = 0; const pending = new Map(); const requests = [];
ws.addEventListener("message", (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Network.requestWillBeSent") requests.push(m.params.request.url);
});
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send("Network.enable");
await send("Emulation.setDeviceMetricsOverride", { width: Number(w), height: Number(h), deviceScaleFactor: Number(mobile) ? 2 : 1, mobile: Number(mobile) === 1 });
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: scheme }] });
await send("Page.enable");
await send("Page.navigate", { url });
await sleep(3500);
for (const sel of click.split("|").filter(Boolean)) { await send("Runtime.evaluate", { expression: `document.querySelector(${JSON.stringify(sel)})?.click()` }); await sleep(700); }
if (scroll) { await send("Runtime.evaluate", { expression: scroll.startsWith("#") ? `document.querySelector(${JSON.stringify(scroll)}).scrollIntoView({behavior:"auto"})` : `scrollTo(0, ${Number(scroll)})` }); await sleep(1200); }
await sleep(2200); // let the waves loop publish a frame-rate sample (every 2 s)
const fps = (await send("Runtime.evaluate", { expression: "window.__epFps ?? null", returnByValue: true })).result.result.value;
const scrollW = (await send("Runtime.evaluate", { expression: "document.documentElement.scrollWidth", returnByValue: true })).result.result.value;
const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
writeFileSync(out, Buffer.from(shot.result.data, "base64"));
const external = requests.filter((u) => !/^(file:|data:|blob:|http:\/\/127\.0\.0\.1|http:\/\/localhost)/.test(u));
console.log(JSON.stringify({ out, viewport: `${w}x${h}`, scrollWidth: scrollW, fps, horizontalScroll: scrollW > Number(w), requests: requests.length, external }, null, 1));
ws.close(); chrome.kill();
process.exit(external.length ? 2 : 0);
