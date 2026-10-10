/**
 * Main screen. Every number shown comes from the exported JSON (reports, graphs, manifests summary);
 * the UI formats, sorts and compares, it never computes a risk figure. Missing data → "not measured".
 */
import { useEffect, useMemo, useState } from "react";
import { GraphView } from "./GraphView";
import { BreakEvenChart, Chip, Evidence, Findings, Position, Runs, Shocks, shockNodes } from "./App";
import { ModeCtx } from "./mode";
import { Hero, HowToRead, LeaveCard, NotModeledCard } from "./Opening";
import { apiPost, getGraph, getIndex, getReport, liveUsable, readStatus, type IndexEntry, type Mode, type Status } from "./data";
import { pct, setAssetDecimals } from "./lib";

const BLOCK = "26,157,638";
const NM = "not measured";
const hashVault = () => /vault=(0x[0-9a-fA-F]{40})/.exec(location.hash)?.[1];
const fmtP = (x: number | null | undefined) => (x === null || x === undefined ? "—" : x > 1 ? ">100 %" : pct(x, 2));

export function Main() {
  const [route, setRoute] = useState(location.hash);
  useEffect(() => { const f = () => setRoute(location.hash); addEventListener("hashchange", f); return () => removeEventListener("hashchange", f); }, []);
  const [theme, setTheme] = useState<string>(() => { try { return localStorage.getItem("ep-theme") || "dark"; } catch { return "dark"; } });
  useEffect(() => {
    document.documentElement.dataset.theme = theme || "dark";
    try { localStorage.setItem("ep-theme", theme); } catch { /* private mode */ }
  }, [theme]);
  if (route.startsWith("#/status")) return <StatusPage theme={theme} setTheme={setTheme} />;
  return <Dashboard theme={theme} setTheme={setTheme} />;
}

function Dashboard({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [fallback, setFallback] = useState<string | null>(null);
  const [index, setIndex] = useState<IndexEntry[]>([]);
  const [vault, setVault] = useState<string>(hashVault() ?? "0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4");
  const [report, setReport] = useState<any>(null);
  const [graph, setGraph] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);
  const [howto, setHowto] = useState(false);
  const [more, setMore] = useState(false);
  const [name, setName] = useState<string>(() => { try { return localStorage.getItem("ep-name") ?? "Jad"; } catch { return "Jad"; } });
  useEffect(() => { try { localStorage.setItem("ep-name", name); } catch { /* ignore */ } }, [name]);

  // mode detection + automatic fallback to the static replay if the fork stops answering
  useEffect(() => {
    let alive = true;
    readStatus().then((s) => {
      if (!alive) return;
      setMode(liveUsable(s) ? "live" : "static");
      if (s.api && !liveUsable(s)) setFallback("The local API answers but the fork is not at block " + BLOCK + ": showing the static replay.");
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => {
    if (mode !== "live") return;
    const t = setInterval(async () => {
      const s = await readStatus();
      if (!liveUsable(s)) { setMode("static"); setFallback(`The live fork stopped answering at ${new Date().toLocaleTimeString()}: switched to the static replay of the same results.`); }
    }, 8000);
    return () => clearInterval(t);
  }, [mode]);
  useEffect(() => { if (mode) getIndex(mode).then(setIndex).catch((e) => setErr(String(e.message))); }, [mode]);
  useEffect(() => {
    if (!mode) return;
    setReport(null); setGraph(null); setErr(null);
    getReport(mode, vault).then((r) => { setAssetDecimals(r.target.assetDecimals); setReport(r); }).catch((e) => setErr(String(e.message)));
    getGraph(mode, vault).then(setGraph).catch(() => setGraph(null));
  }, [mode, vault]);

  const entry = index.find((x) => x.vault.toLowerCase() === vault.toLowerCase());
  return (
    <ModeCtx.Provider value={mode ?? "static"}>
      <header className="nav">
        <a className="logo serif" href="#" aria-label="ExitProof home">ExitProof</a>
        <select value={vault} onChange={(e) => { setVault(e.target.value); location.hash = `vault=${e.target.value}`; }} aria-label="vault">
          {index.length === 0 && <option value={vault}>{vault}</option>}
          {index.map((v) => <option key={v.vault} value={v.vault}>{v.name} ({v.asset})</option>)}
        </select>
        <div className="spacer" />
        <button className="navlink" aria-expanded={howto} onClick={() => setHowto(!howto)}>How to read this page</button>
        <a className="navlink" href="#/status">Status</a>
        <input className="name" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} aria-label="your first name" />
        <button className="pill ghostpill themebtn" onClick={() => setTheme(theme === "light" ? "dark" : "light")} aria-label="switch light or dark theme">{theme === "light" ? "☾ dark" : "☀ light"}</button>
      </header>
      {howto && <HowToRead onClose={() => setHowto(false)} />}
      <div className={`modeline ${mode === "live" ? "live" : "static"}`}>
        {mode === null ? "Detecting the local fork…" : mode === "live"
          ? <>Live · transactions execute on a local copy of Ethereum frozen at block {BLOCK}; nothing is sent to Ethereum.</>
          : <>Results executed on a fork of Ethereum frozen at block {BLOCK}, replayed from the manifests · no network in this view.</>}
        {fallback && <div className="fallback">{fallback}</div>}
      </div>
      <main className="page">
        {err && <section className="card bad">This vault has no exported result ({err}). Pick another vault in the list.</section>}
        {!report && !err && <section className="card">Loading…</section>}
        {report && <>
          <Hero r={report} entry={entry} mode={mode ?? "static"} />
          <LeaveCard r={report} />
          <NotModeledCard r={report} />
          <div className="reveal">
            <button className="pill ghostpill big" aria-expanded={more} onClick={() => setMore(!more)}>{more ? "Hide the dependencies and the proof" : "See the dependencies and the proof"}</button>
          </div>
          {more && <div className="deep">
            {mode === "live" && <div className="card"><b>Analyze another vault</b> <Analyze onDone={(v) => { getIndex("live").then(setIndex); setVault(v); location.hash = `vault=${v}`; }} /></div>}
            <Tabs r={report} g={graph} entry={entry} mode={mode ?? "static"} />
          </div>}
        </>}
      </main>
    </ModeCtx.Provider>
  );
}

function Decision({ r }: { r: any }) {
  const grid: any[] = r.verdictGrid ?? [];
  const [inc, setInc] = useState(Math.max(0, grid.findIndex((g) => g.id === r.bindingIncident)));
  const [h, setH] = useState(30);
  const [hc, setHc] = useState(0.1);
  const [p, setP] = useState<number | null>(null); // null until the user moves the slider: no verdict before that
  if (!grid.length) return (
    <section className="panel"><h2><span className="n">2</span> From what probability does leaving pay off?</h2>
      <p className="sub">No incident could be built for this vault (no collateral market with an answering oracle and identified borrowers): the break-even is {NM}. Exit liquidity above still applies; see also “Not modeled” below.</p></section>
  );
  const g = grid[Math.min(inc, grid.length - 1)];
  const cell = (hc0: number) => g.cells.find((x: any) => x.horizonDays === h && x.lockedHaircut === hc0);
  const c = cell(hc), c10 = cell(0.1), c0 = cell(0);
  const I = r.incidents.find((x: any) => x.id === g.id);
  const u = r.target.assetSymbol;
  const n = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const noExit = c10?.decision === "NO_ACTION_POSSIBLE";
  const above = (x: any) => x && x.breakEven !== null && p !== null && p > x.breakEven;
  const reading = p === null ? "move the slider to compare your probability with p*"
    : noExit ? "cannot exit: less than 1 % of the position can leave"
    : above(c10) && above(c0) ? "leaving pays off under both assumptions"
    : above(c10) ? "leaving pays off only if locked funds cost you 10 %; not if they cost 0 %"
    : "staying is cheaper under both assumptions";
  const sliderStart = Math.min(0.3, c10?.breakEven ?? 0);
  const label = (x: any) => r.shortIncidents?.[x.id] ?? (r.incidents.find((y: any) => y.id === x.id)?.title ?? x.id).replace(/^Incident: /, "");
  return (
    <section className="panel">
      <h2><span className="n">2</span> From what probability does leaving pay off?</h2>
      <p className="sub">Break-even p* = exit cost ÷ (incident loss × share that can leave now). Exit cost = yield given up on what leaves + gas executed on the fork + measured slippage. Values are precomputed in the report; nothing predicts the incident.</p>
      <div className="row" style={{ marginBottom: 8 }}>
        {grid.map((x: any, i: number) => <button key={x.id} className={i === inc ? "on" : ""} onClick={() => setInc(i)}>{label(x)}</button>)}
      </div>
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="muted">horizon</span>{[7, 30, 90].map((x) => <button key={x} className={h === x ? "on" : ""} onClick={() => setH(x)}>{x} d</button>)}
      </div>
      <div className="kpis four">
        <div className="kpi"><div className="l">p* if locked funds cost 10 % <Chip k="hyp" /></div><div className="v">{fmtP(c10?.breakEven)}</div><div className="muted" style={{ fontSize: 12 }}>L = {c10 ? n(c10.incidentLoss) : NM} {u} within {h} days</div></div>
        <div className="kpi"><div className="l">p* if locked funds cost 0 % <Chip k="hyp" /></div><div className="v">{fmtP(c0?.breakEven)}</div><div className="muted" style={{ fontSize: 12 }}>L = {c0 ? n(c0.incidentLoss) : NM} {u} within {h} days</div></div>
        <div className="kpi"><div className="l">Implied by the yield spread <Chip k="hyp" /></div>
          {!c10 || c10.implied.length === 0 ? <div style={{ fontSize: 13 }}>not evaluated: no sourced reference yield for {u}</div>
            : c10.implied.map((x: any) => <div key={x.reference} style={{ fontSize: 13, margin: "3px 0" }}>vs {x.reference}: <b>{x.value === null ? "not evaluated" : fmtP(x.value)}</b>{x.reason ? <div className="muted" style={{ fontSize: 11.5 }}>{String(x.reason).replace(/^not evaluated: /, "")}</div> : null}</div>)}
          <div className="muted" style={{ fontSize: 11 }}>risk-neutral, includes liquidity and smart-contract premia; not a prediction.</div></div>
        <div className="kpi"><div className="l">Your probability <Chip k="hyp" /></div>
          <input type="range" min={0} max={0.3} step={0.0025} value={p ?? sliderStart} onChange={(e) => setP(Number(e.target.value))} aria-label="your probability" style={{ width: "100%" }} />
          <div className="v">{p === null ? "—" : pct(p, 2)}</div>
          <div className={p === null ? "muted" : reading.startsWith("leaving pays off under") ? "bad" : reading.startsWith("staying") ? "ok" : "warn"} style={{ fontSize: 13 }}>{reading}</div></div>
      </div>
      <div className="note" style={{ margin: "10px 0" }}>{I?.regime}. Value loss source: {I?.valueSource}.</div>
      <div className="row" style={{ margin: "4px 0 6px" }}><span className="muted">breakdown for locked funds at</span>{[0.1, 0].map((x) => <button key={x} className={hc === x ? "on" : ""} onClick={() => setHc(x)}>{x * 100} %</button>)}</div>
      {!c ? <p>{NM}</p> : <div className="grid2">
        <table><tbody>
          <tr><td>Value loss of the position <span className="chip modeled">modeled</span></td><td className="r bad">{n(c.valueLoss)} {u}</td></tr>
          <tr><td>Locked after the run <Chip k="fork" /> × cost of locked {pct(hc, 0)} <Chip k="hyp" /></td><td className="r">{n(c.lockedAfterRun)} × {pct(hc, 0)} = {n(c.lockedPart)}</td></tr>
          <tr><td><b>Incident loss L</b></td><td className="r"><b>{n(c.incidentLoss)} {u}</b></td></tr>
          <tr><td>Yield given up ({pct(r.verdictParams.netApy, 2)} net APY <Chip k="onchain" />, {h} d)</td><td className="r">{n(c.forgoneYield)}</td></tr>
          <tr><td>Gas out + back (gas executed on the fork × base fee of the block){r.verdictParams.gasNote ? <div className="muted" style={{ fontSize: 11 }}>{r.verdictParams.gasNote}</div> : null}</td><td className="r">{c.gas.toFixed(6)}</td></tr>
          <tr><td>Slippage (measured on the fork)</td><td className="r">{c.slippage.toFixed(6)}</td></tr>
          <tr><td><b>Exit cost</b></td><td className="r"><b>{n(c.exitCost)} {u}</b></td></tr>
          <tr><td>Share of the position that can leave now <Chip k="fork" /></td><td className="r">{pct(c.exitableShare)}</td></tr>
          <tr><td><b>p* for this breakdown</b></td><td className="r"><b>{fmtP(c.breakEven)}</b></td></tr>
        </tbody></table>
        <div>{g.id.includes("blind") && <BreakEvenChart curve={r.depegCurve} coll={r.depegCurveCollateral} h={30} p={p ?? 0} inc={0} />}</div>
      </div>}
    </section>
  );
}

const TABS = ["Dependencies", "Exits in detail", "Decision in detail", "Shocks", "Withdraw queue", "Evidence", "Replay"] as const;

function Tabs({ r, g, entry, mode }: { r: any; g: any; entry?: IndexEntry; mode: Mode }) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Dependencies");
  const [shockSel, setShockSel] = useState<number | null>(null);
  const highlight = useMemo(() => (g && shockSel !== null ? shockNodes(g, r.sweep[shockSel]) : undefined), [g, r, shockSel]);
  return (
    <>
      <div className="tabs" role="tablist">{TABS.map((t) => <button key={t} role="tab" className={tab === t ? "on" : ""} onClick={() => setTab(t)}>{t}</button>)}</div>
      {tab === "Dependencies" && (
        <section className="panel">
          <h2><span className="n">3</span> Why: the dependency stack</h2>
          {!g ? <p>{NM} (graph not exported)</p> : <>
            <Layers g={g} />
            <Findings g={g} />
            <GraphView key={g.target.vault} g={g} highlight={highlight} />
          </>}
        </section>
      )}
      {tab === "Exits in detail" && <Runs r={r} />}
      {tab === "Decision in detail" && <Decision r={r} />}
      {tab === "Shocks" && <><Shocks r={r} sel={shockSel} setSel={setShockSel} />{shockSel !== null && <p className="muted">The propagation path is highlighted in red in the Dependencies tab.</p>}</>}
      {tab === "Withdraw queue" && <Position r={r} />}
      {tab === "Evidence" && <Evidence r={r} />}
      {tab === "Replay" && <ReplayTab r={r} entry={entry} mode={mode} />}
    </>
  );
}

/** The 7 layers with how each is known. Counts come from the exported graph. */
function Layers({ g }: { g: any }) {
  const count = (pred: (n: any) => boolean) => g.nodes.filter(pred).length;
  const L: [string, string, number, string][] = [
    ["L0", "Settlement: Ethereum mainnet, block header", count((n: any) => n.kind === "chain"), "read on-chain"],
    ["L1", "Vault, governance (Safe owners), allocators", count((n: any) => n.layer === 1 && n.kind !== "peerVault" && n.kind !== "holders"), "read on-chain"],
    ["L2", "Morpho Blue markets of the withdraw queue", count((n: any) => n.kind === "market"), "read on-chain"],
    ["L3", "Oracles, collateral tokens, IRM, borrowers", count((n: any) => n.layer === 3), "read on-chain (borrowers: API candidates, re-read on-chain)"],
    ["L4", "Price feeds, exchange-rate adapters, yield source, AMM pools", count((n: any) => n.layer === 4), "read on-chain; feed update intervals observed; AMM depth quoted at the block"],
    ["L5", "Chainlink aggregators, upstream owners", count((n: any) => n.layer === 5), "read on-chain"],
    ["L6", "Contagion: peer vaults in the same markets, holders", count((n: any) => n.kind === "peerVault" || n.kind === "holders"), "read on-chain; their exits executed on the fork"],
  ];
  return (
    <table className="layers"><tbody>
      {L.map(([k, d, c, how]) => <tr key={k}><td className="mono">{k}</td><td>{d}</td><td className="r">{c} nodes</td><td className="muted" style={{ fontSize: 12 }}>{how}</td></tr>)}
    </tbody></table>
  );
}

function ReplayTab({ r, entry, mode }: { r: any; entry?: IndexEntry; mode: Mode }) {
  const [log, setLog] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const replay = async () => {
    setBusy(true); setLog("replaying every scenario on the fork…");
    try { const o: any = await apiPost(`/api/replay?vault=${r.target.vault}`, {}); setLog(o.log); } catch (e) { setLog(String((e as Error).message)); }
    setBusy(false);
  };
  return (
    <section className="panel">
      <h2><span className="n">8</span> Replay: every number, to the wei</h2>
      <p className="sub">Each scenario is recorded in a manifest (inputs, timestamps T0 + 12·k, expected amounts, statuses and decoded errors). The replay re-executes them on a fresh fork and compares to the wei; transaction hashes are not compared.</p>
      <div className="kv mono">
        <div className="k">manifest</div><div>{entry?.manifest?.file ?? NM}</div>
        <div className="k">sha256</div><div>{entry?.manifest?.sha256 ?? NM}</div>
        <div className="k">scenarios</div><div>{entry?.manifest ? `${entry.manifest.scenarios}${entry.manifest.cushionProbes ? ` + cushion bisection (${entry.manifest.cushionProbes} executions)` : ""}` : NM}</div>
        <div className="k">last replay</div><div>{entry?.replay ? `${entry.replay.verdict} · ${entry.replay.okScenarios}/${entry.replay.scenarios} scenarios · hash ${entry.replay.hashOk ? "OK" : "FAIL"} · cushion ${entry.replay.cushionOk ? "OK" : "FAIL"} · ${entry.replay.at}` : NM}</div>
        <div className="k">source</div><div>chainId 1 · block 26157638 · 0x3e8450286456e913f08f2290aa3eac5e0c8b6d5be51bef3955032d9c43977bf4</div>
      </div>
      {mode === "live"
        ? <div style={{ marginTop: 10 }}><button className="primary" disabled={busy} onClick={replay}>{busy ? "Replaying…" : "Replay everything now on the fork"}</button>{log && <div className="log mono" style={{ marginTop: 8 }}>{log}</div>}</div>
        : <p className="muted" style={{ marginTop: 10 }}>To replay yourself: <span className="mono">npm ci; npm run proxy; npm run fork; npm run replay -- {r.target.vault}</span> (README, “Run it”).</p>}
    </section>
  );
}

function Analyze({ onDone }: { onDone: (vault: string) => void }) {
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const go = async () => {
    const v = addr.trim();
    setBad(false);
    if (!/^0x[0-9a-fA-F]{40}$/.test(v)) { setBad(true); setMsg("Enter a vault address: 0x followed by 40 hex characters."); return; }
    setBusy(true); setMsg("starting…");
    try {
      await apiPost("/api/analyze", { vault: v });
      const deadline = Date.now() + 20 * 60_000;
      for (;;) {
        await new Promise((res) => setTimeout(res, 2000));
        if (Date.now() > deadline) throw new Error("No answer after 20 minutes: check the API terminal.");
        const resp = await fetch(`/api/analyze?vault=${v}`);
        const s = await resp.json().catch(() => ({}));
        if (!resp.ok || !s.state) throw new Error(s.error ?? "The analysis was lost (API restarted?). Please retry.");
        if (s.state === "done") { setMsg(`${s.result.name}: ${s.result.nodes} nodes, ${s.result.seconds} s`); onDone(s.vault); break; }
        if (s.state === "error") throw new Error(s.error.message);
        setMsg(`${s.stage}: ${s.log[s.log.length - 1] ?? "…"}`);
      }
    } catch (e) { setBad(true); setMsg(String((e as Error).message)); }
    setBusy(false);
  };
  return (
    <div className="row analyze">
      <input value={addr} onChange={(e) => setAddr(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !busy && go()} placeholder="any MetaMorpho V1 vault 0x…" className="mono" aria-label="vault address" />
      <button disabled={busy} onClick={go}>{busy ? "Analyzing…" : "Analyze"}</button>
      {msg && <span className={`status ${bad ? "bad" : ""}`}>{msg}</span>}
    </div>
  );
}

function StatusPage({ theme, setTheme }: { theme: string; setTheme: (t: string) => void }) {
  const [s, setS] = useState<Status | null>(null);
  const [at, setAt] = useState("");
  useEffect(() => {
    const tick = () => readStatus().then((x) => { setS(x); setAt(new Date().toLocaleTimeString()); });
    tick();
    const t = setInterval(tick, 3000);
    return () => clearInterval(t);
  }, []);
  const Row = ({ ok, label, detail }: { ok: boolean; label: string; detail: string }) => (
    <tr><td><span className={`dot ${ok ? "up" : "down"}`} /> {label}</td><td className={ok ? "ok" : "bad"}>{ok ? "up" : "down"}</td><td className="muted">{detail}</td></tr>
  );
  const forkOk = !!s?.fork && s.fork.head === s.fork.sourceBlock;
  return (
    <>
      <div className="top"><div className="brand">Exit<span>Proof</span></div><span className="status">status, refreshed every 3 s ({at})</span><div className="spacer" /><button className="ghost" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>theme</button><a className="status" href="#">back</a></div>
      <main>
        <section className="panel">
          <h2>Live stack</h2>
          {!s ? <p>checking…</p> : <table><tbody>
            <Row ok={s.api} label="API (127.0.0.1:8700)" detail={s.api ? "answers" : location.protocol === "file:" ? "opened from disk: static replay only" : "not reachable: the UI uses the static replay"} />
            <Row ok={!!s.proxy} label="RPC proxy (127.0.0.1:8600)" detail={s.proxy ? `mode: ${s.proxy.mode === "offline" ? "offline (cache only)" : "online"}` : "not reachable"} />
            <Row ok={forkOk} label="Fork (127.0.0.1:8545) at block 26,157,638" detail={s.fork ? `local head ${s.fork.head}${forkOk ? "" : " ≠ 26157638"}` : "not reachable"} />
          </tbody></table>}
          <p style={{ marginTop: 10 }}>Mode: <b>{s && liveUsable(s) ? "live (fork)" : "static replay"}</b>{s?.proxy ? ` · network: ${s.proxy.mode === "offline" ? "offline" : "online"}` : ""}</p>
        </section>
      </main>
    </>
  );
}
