import { useEffect, useMemo, useState } from "react";
import { decide, scaleTo18 } from "../../src/verdict/verdict.ts";
import { GraphView } from "./GraphView";
import { api, etherscan, pct, setAssetDecimals, short, w, type Graph, type Report } from "./lib";

const Chip = ({ k }: { k: "onchain" | "fork" | "hyp" | "offchain" }) => (
  <span className={`chip ${k}`}>{{ onchain: "on-chain", fork: "fork", hyp: "hypothesis", offchain: "off-chain list" }[k]}</span>
);

export function App() {
  const [report, setReport] = useState<Report | null>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [reports, setReports] = useState<{ vault: string; name: string; asset: string; catalog: string }[]>([]);
  const [vault, setVault] = useState<string>(/vault=(0x[0-9a-fA-F]{40})/.exec(location.hash)?.[1] ?? "0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4");
  const [status, setStatus] = useState<any>(null);
  const [shockSel, setShockSel] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<typeof reports>("/api/reports").then(setReports).catch(() => {});
    const tick = () => api("/api/status").then(setStatus).catch(() => setStatus(null));
    tick();
    const t = setInterval(tick, 8000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    setShockSel(null);
    api<Report>(`/api/report?vault=${vault}`).then((r) => { setAssetDecimals(r.target.assetDecimals); setReport(r); }).catch((e) => setErr(String(e)));
    api<Graph>(`/api/graph/${vault}`).then(setGraph).catch((e) => setErr(String(e)));
  }, [vault]);

  const highlight = useMemo(() => (graph && report && shockSel !== null ? shockNodes(graph, report.sweep[shockSel]) : undefined), [graph, report, shockSel]);

  if (err) return <main><section className="panel bad">API error: {err}. Start the API (npm run api) and the fork.</section></main>;
  if (!report) return <main><section className="panel">Loading…</section></main>;
  const date = new Date(Number(report.source.timestamp) * 1000).toISOString().replace("T", " ").slice(0, 16) + " UTC";

  return (
    <>
      <div className="top">
        <div className="brand">Exit<span>Proof</span></div>
        <div className="badge">Local fork of Ethereum — block {Number(report.source.block).toLocaleString("en-US")} · {date}</div>
        <div className="status">
          proxy: {status?.proxy ? <b className={status.proxy.mode === "offline" ? "warn" : "ok"}>{status.proxy.mode}</b> : <b className="bad">down</b>}
          {" · "}fork: {status?.fork ? <b className="ok">up (local head {status.fork.head})</b> : <b className="bad">down</b>}
        </div>
        <select value={vault} onChange={(e) => { setVault(e.target.value); location.hash = `vault=${e.target.value}`; }}>
          {reports.map((v) => <option key={v.vault} value={v.vault}>{v.name} ({v.asset})</option>)}
        </select>
        <Analyze onDone={(v) => { api<typeof reports>("/api/reports").then(setReports); setVault(v); location.hash = `vault=${v}`; }} />
        <div className="legend"><Chip k="onchain" /> real data read at the block <Chip k="fork" /> tx simulated locally <Chip k="hyp" /> scenario assumption <Chip k="offchain" /> candidates from Morpho API, verified on-chain</div>
      </div>
      <main>
        <Headline r={report} />
        <GetBack key={"g" + report.target.vault} r={report} />
        <VerdictPanel key={"v" + report.target.vault} r={report} />
        <section className="panel">
          <h2><span className="n">3</span> Why: the dependency stack, discovered from contract reads</h2>
          <p className="sub">Starting from the vault address only. Each box and link carries the reads it rests on (call, contract, block). Red = path of the selected shock (section 5).</p>
          {graph && <Findings g={graph} />}
          {graph && graph.target.vault === report.target.vault && <GraphView key={graph.target.vault} g={graph} highlight={highlight} />}
        </section>
        <Runs key={"r" + report.target.vault} r={report} />
        <Shocks key={"s" + report.target.vault} r={report} sel={shockSel} setSel={setShockSel} />
        <Position r={report} />
        <Evidence r={report} />
        <Proofs key={"p" + report.target.vault} r={report} />
      </main>
    </>
  );
}

function Headline({ r }: { r: Report }) {
  if (!r.headline) return null;
  const word = r.headline.split(":")[0];
  const cls = word.startsWith("EXIT") ? "EXIT" : word.startsWith("CANNOT") ? "NO_ACTION_POSSIBLE" : "STAY";
  return (
    <section className={`verdict ${cls}`} style={{ fontSize: 16 }}>
      <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Verdict for the {r.target.holderLabel} of {r.target.name}, at the default assumptions (adjust in section 2) <Chip k="hyp" /></div>
      <b>{word}</b>{r.headline.slice(word.length)}
    </section>
  );
}

function GetBack({ r }: { r: Report }) {
  const gb = r.getBack;
  const [live, setLive] = useState<Record<string, { out: string; ok: boolean; err: string | null; ms: number } | string>>({});
  if (!gb) return null;
  const value = BigInt(r.target.holderValue);
  const share = (x: string) => pct(Number(BigInt(x) * 10000n / (value || 1n)) / 10000, 0);
  const runLive = async (key: string, exits: { vault: string; owner: string; label: string }[]) => {
    setLive({ ...live, [key]: "executing on the fork…" });
    try {
      const o: any = await api("/api/run", { vault: r.target.vault, holder: r.target.holder, exits });
      const ex = o.result.results.filter((x: any) => x.type === "exit" && x.result.owner === r.target.holder);
      const out = ex[0].result.ok ? ex[0].result.assetsOutWei : ex[1]?.result.assetsOutWei ?? "0";
      setLive((l) => ({ ...l, [key]: { out, ok: ex[0].result.ok, err: ex[0].result.error?.name ?? null, ms: o.ms } }));
    } catch (e) { setLive((l) => ({ ...l, [key]: String((e as Error).message) })); }
  };
  const cards = [
    { key: "alone", title: "I exit alone", sub: "nobody moves before me", d: gb.alone, exits: [] as any[] },
    gb.afterHolder && { key: "holder", title: "Another large holder exits first", sub: gb.afterHolder.who, d: gb.afterHolder, exits: [{ vault: gb.afterHolder.otherVault, owner: r.runs.find((x: any) => x.id === gb.afterHolder.id)?.others[0].owner, label: gb.afterHolder.who }] },
    gb.afterPeer && { key: "peer", title: "A depositor of ANOTHER vault exits first", sub: gb.afterPeer.who + " (holds no share of this vault)", d: gb.afterPeer, exits: [{ vault: gb.afterPeer.otherVault, owner: r.runs.find((x: any) => x.id === gb.afterPeer.id)?.others[0].owner, label: gb.afterPeer.who }] },
  ].filter(Boolean) as any[];
  return (
    <section className="panel" style={{ borderColor: "#2f81f7" }}>
      <h2><span className="n">1</span> What I really get back <Chip k="fork" /> <Chip k="hyp" /></h2>
      <p className="sub">Same block, same starting state, position of {w(r.target.holderValue)} {r.target.assetSymbol}. Only the order of exits changes. Each number is a real withdrawal executed on a local fork of Ethereum; other holders are impersonated (a scenario, not their intention). Ratings (e.g. Credora) and risk pages (e.g. DefiLlama) describe the vault's risk; this section executes <b>your</b> exit in a given order.</p>
      <div className="kpis" style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(0,1fr))` }}>
        {cards.map((c: any) => {
          const l = live[c.key];
          return (
            <div className="kpi" key={c.key}>
              <div className="l"><b style={{ color: "var(--text)" }}>{c.title}</b></div>
              <div className="muted" style={{ fontSize: 12, minHeight: 32 }}>{c.sub}</div>
              <div className="v" style={{ fontSize: 26 }}>
                <span className={c.d.fullExitOk ? "ok" : "bad"}>{w(c.d.outWei)}</span> <small>{r.target.assetSymbol} · {share(c.d.outWei)}</small>
              </div>
              <div style={{ fontSize: 12, margin: "4px 0 8px" }}>{c.d.fullExitOk ? <span className="ok">✓ full exit succeeds</span> : <span className="bad">✗ full exit reverts {c.d.error}; maximum shown</span>}{c.d.changePct ? <span className="bad"> · {c.d.changePct} % vs alone</span> : null}</div>
              <button onClick={() => runLive(c.key, c.exits)} disabled={typeof l === "string" && l.startsWith("executing")}>Execute again on the fork</button>
              {l && <div style={{ fontSize: 12, marginTop: 6 }} className="mono">{typeof l === "string" ? l : <>{l.ok ? "✓" : "✗ " + l.err} → {w(l.out, 4)} in {l.ms} ms {l.out === c.d.outWei ? <span className="ok">(identical to the wei)</span> : null}</>}</div>}
            </div>
          );
        })}
      </div>
      {r.cushion && r.cushion.revertsAt !== "none" && <p style={{ margin: "10px 0 0" }}>Cushion: my full exit survives as long as less than <b>{w(r.cushion.passesAt, 3)}</b> {r.target.assetSymbol} leaves before me (bisection on the fork). Beyond it, every unit others withdraw is a unit I cannot.</p>}
    </section>
  );
}

function Analyze({ onDone }: { onDone: (vault: string) => void }) {
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const go = async () => {
    const v = addr.trim();
    setErr(false);
    if (!/^0x[0-9a-fA-F]{40}$/.test(v)) { setErr(true); setMsg("Enter a vault address: 0x followed by 40 hex characters."); return; }
    setBusy(true); setMsg("starting…");
    try {
      const r = await fetch("/api/analyze", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ vault: v }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? r.statusText);
      // poll the background job
      const deadline = Date.now() + 20 * 60_000;
      for (;;) {
        await new Promise((res) => setTimeout(res, 2000));
        if (Date.now() > deadline) throw new Error("No answer after 20 minutes: check the API terminal.");
        const resp = await fetch(`/api/analyze?vault=${v}`);
        const s = await resp.json().catch(() => ({}));
        if (!resp.ok || !s.state) throw new Error(s.error ?? "The analysis was lost (API restarted?). Please retry.");
        if (s.state === "done") { setMsg(`${s.result.name}: ${s.result.nodes} nodes, ${s.result.reads} reads, ${s.result.seconds} s`); onDone(s.vault); break; }
        if (s.state === "error") throw new Error(s.error.message);
        setMsg(`${s.stage}: ${s.log[s.log.length - 1] ?? "…"}`);
      }
    } catch (e) { setErr(true); setMsg(String((e as Error).message)); }
    setBusy(false);
  };
  return (
    <div className="row" style={{ gap: 6 }}>
      <input value={addr} onChange={(e) => setAddr(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !busy && go()} placeholder="any MetaMorpho V1 vault 0x…" className="mono"
        style={{ width: 330, background: "var(--panel2)", color: "var(--text)", border: "1px solid var(--line)", borderRadius: 6, padding: 6 }} />
      <button disabled={busy} onClick={go}>{busy ? "Analyzing…" : "Analyze"}</button>
      {msg && <span className={`status ${err ? "bad" : ""}`} style={{ maxWidth: 520 }}>{msg}</span>}
    </div>
  );
}

function Position({ r }: { r: Report }) {
  const t = r.target, v = r.vault;
  return (
    <section className="panel">
      <h2><span className="n">6</span> Position and withdraw queue: {t.name} <span className="muted" style={{ fontWeight: 400 }}>{t.version} · asset {t.assetSymbol}</span></h2>
      <p className="sub">Vault <a className="mono" href={etherscan(t.vault)} target="_blank" rel="noreferrer">{t.vault}</a> · holder: the {t.holderLabel} <a className="mono" href={etherscan(t.holder)} target="_blank" rel="noreferrer">{short(t.holder)}</a> · amounts in {t.assetSymbol}, no USD conversion</p>
      <div className="kpis">
        <div className="kpi"><div className="l">Vault total assets <Chip k="onchain" /></div><div className="v">{w(v.totalAssets)}</div></div>
        <div className="kpi"><div className="l">Withdrawable now <Chip k="onchain" /></div><div className="v">{w(v.withdrawableNow, 3)} <small>{pct(v.liquidRatio)}</small></div></div>
        <div className="kpi"><div className="l">Lent to borrowers <Chip k="onchain" /></div><div className="v">{w(v.lentOutNotWithdrawable)}</div></div>
        <div className="kpi"><div className="l">Holder position <Chip k="onchain" /></div><div className="v">{w(t.holderValue)} <small>{BigInt(v.totalAssets) > 0n ? pct(Number(BigInt(t.holderValue) * 10000n / BigInt(v.totalAssets)) / 10000) : "—"} of vault</small></div></div>
        <div className="kpi"><div className="l">Holder exits alone <Chip k="fork" /></div><div className="v ok">{w(r.runs[0].holderExecutedExit)}</div></div>
        <div className="kpi"><div className="l">Net supply APY <Chip k="onchain" /></div><div className="v">{pct(v.netApy, 2)}</div></div>
        <div className="kpi"><div className="l">Public Allocator backstop <Chip k="onchain" /></div><div className="v">{w(v.publicAllocatorReallocatableIntoExposedMarkets)} <small>net, up to</small></div></div>
      </div>
      <h3 style={{ fontSize: 14, margin: "14px 0 6px" }}>Why only {pct(v.liquidRatio)} can leave: the withdraw queue, market by market <Chip k="onchain" /></h3>
      <table>
        <thead><tr><th>#</th><th>Collateral</th><th className="r">LLTV</th><th className="r">Vault supply</th><th className="r">Market idle liquidity</th><th className="r">Utilization</th><th className="r">Withdrawable by vault</th><th className="r">Supply APR</th></tr></thead>
        <tbody>
          {r.queue.map((q: any) => (
            <tr key={q.id} className={BigInt(q.vaultSupply) > 0n ? "" : "muted"}>
              <td>{q.index}</td><td>{q.collateral}</td><td className="r">{pct(Number(q.lltv) / 1e18)}</td><td className="r">{w(q.vaultSupply)}</td>
              <td className="r">{w(q.liquidity)}</td><td className="r">{pct(q.utilization)}</td><td className="r"><b>{w(q.withdrawable)}</b></td><td className="r">{pct(q.supplyApr, 2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Findings({ g }: { g: Graph }) {
  const items: string[] = [];
  const nodes: any[] = g.nodes;
  const exposed = g.markets.filter((m: any) => BigInt(m.vaultSupplyAssets) > 0n);
  for (const m of exposed) {
    const o = nodes.find((n) => n.id === `oracle:${m.params.oracle}`);
    const feeds = g.edges.filter((e: any) => e.from === o?.id).map((e: any) => nodes.find((n) => n.id === e.to)?.label);
    if (o?.data.router) items.push(`${m.collateralSymbol} market #${m.queueIndex}: oracle is a primary/backup router (deviation challenge ${(Number(o.data.deviationThreshold) / 1e16).toFixed(0)}%, ${o.data.isPrimary ? "primary active" : "backup active"}); legs: ${feeds.join(" | ")}.`);
    else if (o) items.push(`${m.collateralSymbol} market #${m.queueIndex}: priced by ${feeds.join(", ") || "opaque oracle"}${feeds.length === 1 && String(feeds[0]).includes("exchange rate") ? " only — the oracle follows the redemption rate, not the market price: a market depeg is invisible to liquidations." : "."}`);
  }
  const vnode = nodes.find((n) => n.id === `vault:${g.target.vault}`);
  const gov = nodes.filter((n) => n.kind === "governance" && ["owner", "curator", "guardian"].includes(String(n.data.role)));
  if (vnode) items.push(`Governance: ${gov.map((n) => n.label).join(", ")}; changes to caps, markets and fees wait a ${Number(vnode.data.timelockSeconds) / 86400}-day timelock (guardian can veto).`);
  const feeds = nodes.filter((n) => n.kind === "feed" && typeof n.data.ageSeconds === "number");
  if (feeds.length) {
    const h = (sec: number) => (sec / 3600).toFixed(1) + " h";
    const late = feeds.filter((f) => f.data.observedUpdates && !f.data.observedUpdates.ageWithinObservedMax);
    const oldest = feeds.reduce((x, y) => ((x.data.ageSeconds as number) > (y.data.ageSeconds as number) ? x : y));
    const u = oldest.data.observedUpdates;
    items.push(late.length
      ? `Freshness ALERT: ${late.map((f) => `${f.data.description} last updated ${h(f.data.ageSeconds as number)} before the block, longer than any of its last ${f.data.observedUpdates.roundsObserved} update intervals (max ${h(f.data.observedUpdates.maxGapSeconds)})`).join("; ")}. Morpho oracles do not check staleness.`
      : `Freshness: every Chainlink feed updated within its usual interval. Oldest: ${oldest.data.description}, ${h(oldest.data.ageSeconds as number)} old${u ? `; over its last ${u.roundsObserved} rounds it updated at most every ${h(u.maxGapSeconds)} (heartbeat-like) ${(u.minTriggeredMovePct ?? u.medianMovePct) < 0.05 ? "(heartbeat-driven)" : `or on moves of ~${(u.minTriggeredMovePct ?? u.medianMovePct).toFixed(1)} %`} (observed on-chain; Chainlink does not publish these on-chain)` : ""}. Morpho oracles do not check staleness themselves.`);
  }
  for (const n of (g.notes ?? []).filter((x: string) => x.includes("price() reverts"))) items.push("Frozen market: " + n);
  const hl = g.holders?.list ?? [];
  if (hl.length) items.push(`Ownership: the largest holder has ${pct(hl[0].shareOfSupply)} of the shares, the top 3 ${pct(hl.slice(0, 3).reduce((s: number, h: any) => s + h.shareOfSupply, 0))} (balances re-read on-chain; ${pct(g.holders.coverage)} of supply identified).`);
  const peerShared = g.peers.length;
  if (peerShared) items.push(`${peerShared} other MetaMorpho vaults lend in the same markets (they compete for the same idle liquidity).`);
  for (const m of exposed) {
    const b = g.borrowers[m.id];
    if (b?.list?.length) {
      const top = b.list[0];
      items.push(`${m.collateralSymbol} market #${m.queueIndex}: ${b.count} borrowers (${pct(b.coverage, 2)} of debt identified on-chain); largest owes ${w(top.debt)} ${g.target.assetSymbol} = ${pct(Number(BigInt(top.debt) * 10000n / BigInt(m.totalBorrowAssets)) / 10000)} of the market's debt.`);
    }
  }
  return (
    <ul style={{ margin: "0 0 12px", paddingLeft: 18, lineHeight: 1.5 }}>
      {items.map((s, i) => <li key={i}>{s}</li>)}
    </ul>
  );
}

function shockNodes(g: Graph, row: any): Set<string> {
  const s = new Set<string>();
  if (!row) return s;
  const target = row.kind === "feed" ? `feed:${row.node}` : row.kind === "blindDepeg" ? `token:${row.node}` : `oracle:${row.node}`;
  s.add(target);
  for (const m of row.markets) {
    const start = `market:${m.id}`;
    s.add(start);
    s.add(`vault:${g.target.vault}`);
    // DFS from the market to the shocked node, keep nodes on any path
    const onPath = (id: string, seen: Set<string>): boolean => {
      if (id === target) return true;
      let hit = false;
      for (const e of g.edges) if (e.from === id && !seen.has(e.to)) { seen.add(e.to); if (onPath(e.to, seen)) { s.add(e.to); hit = true; } }
      return hit;
    };
    onPath(start, new Set([start]));
  }
  return s;
}

function Runs({ r }: { r: Report }) {
  const [order, setOrder] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<any>(null);
  const alone = BigInt(r.runs[0].holderExecutedExit);
  const otherRank = r.cushion ? (r.vault.holders.list.findIndex((h: any) => h.address === r.cushion.otherHolder) + 1) || 2 : 2;
  // Every competing exit that appears in the report's runs, in first-seen order
  const actorMap = new Map<string, { vault: string; owner: string; label: string }>();
  for (const x of r.runs) for (const o of x.others) actorMap.set(`${o.vault}:${o.owner}`, { vault: o.vault, owner: o.owner, label: o.label + (o.vault !== r.target.vault ? " (other vault)" : "") });
  const actors = [...actorMap.entries()].map(([k, a]) => [k, a.label] as [string, string]);
  const run = async () => {
    setBusy(true); setLive(null);
    try { setLive(await api("/api/run", { vault: r.target.vault, holder: r.target.holder, exits: order.map((k) => actorMap.get(k)) })); } catch (e) { setLive({ error: String(e) }); }
    setBusy(false);
  };
  return (
    <section className="panel">
      <h2><span className="n">4</span> Exit liquidity in detail: who leaves before you? <Chip k="fork" /> <Chip k="hyp" /></h2>
      <p className="sub">Same block, same state; only the order of exits changes. Real holders at the block, impersonated on the local fork (scenario assumption, not their intention). Each line is an executed transaction sequence.</p>
      <table>
        <thead><tr><th>Exits executed before the holder</th><th className="r">Holder max withdraw</th><th>Full exit</th><th style={{ width: "34%" }}>Position: exitable vs locked</th><th className="r">vs alone</th></tr></thead>
        <tbody>
          {r.runs.map((x: any) => {
            const ex = Number(BigInt(x.holderExecutedExit) * 1000n / BigInt(r.target.holderValue)) / 10;
            return (
              <tr key={x.id}>
                <td>{x.others.length ? x.others.map((o: any) => o.label).join(" → ") : <i>nobody</i>}</td>
                <td className="r"><b>{w(x.holderExecutedExit)}</b></td>
                <td>{x.fullExitOk ? <span className="ok">✓ succeeds</span> : <span className="bad">✗ revert {x.fullExitError?.name}</span>}</td>
                <td><div className="bar"><div className="exit" style={{ width: `${ex}%` }} /><div className="lock" style={{ left: `${ex}%`, right: 0 }} /><span>{ex.toFixed(0)}% exitable</span></div></td>
                <td className={`r ${x.changePct < 0 ? "bad" : "muted"}`}>{x.changePct === 0 ? "—" : `${x.changePct.toFixed(1)}%`}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {r.cushion && (r.cushion.revertsAt === "none" ? (
        <p style={{ marginTop: 10 }}><b>Cushion before blockage <Chip k="fork" />:</b> even if holder #{otherRank} withdraws everything it can ({w(r.cushion.passesAt)}) first, the holder's full exit still succeeds.</p>
      ) : (
        <p style={{ marginTop: 10 }}>
          <b>Cushion before blockage <Chip k="fork" />:</b> the holder's full exit still succeeds if holder #{otherRank} withdraws <b>{w(r.cushion.passesAt, 3)}</b> first, and reverts at <b>{w(r.cushion.revertsAt, 3)}</b> (bisection, {r.cushion.probes} executions, precision 0.001). Below the cushion other exits cost nothing; above it every unit others withdraw is a unit you cannot.
        </p>
      ))}
      {r.mitigation ? (
        <div className="note" style={{ borderLeftColor: "var(--ok)", background: "#3fb95010", margin: "8px 0" }}>
          <b>Mitigation executed <Chip k="fork" />:</b> after the worst run, anyone can call the Morpho Public Allocator to move peer vaults' funds into this vault's markets.
          {" "}{r.mitigation.reallocations.map((x: any) => `${short(x.vault)}: ${x.ok ? w(x.moved) + " moved" : "reverted " + (x.error ?? "")}`).join("; ")}.
          {" "}Holder exitable: <b>{w(r.mitigation.withoutWei)}</b> without → <b className="ok">{w(r.mitigation.withWei)}</b> with the reallocation{r.mitigation.fullExitWithPa ? " (full exit succeeds)" : ""}. Fee paid to the Public Allocator included in the transaction.
        </div>
      ) : (
        <p className="muted" style={{ fontSize: 12 }}>Public Allocator mitigation: no peer vault lets anyone move net liquidity into this vault's markets at this block (flow caps at 0, or only between markets this vault already uses).</p>
      )}
      <h3 style={{ fontSize: 14, margin: "14px 0 6px" }}>Run it live on the fork</h3>
      <div className="row">
        {actors.map(([k, label]) => (
          <button key={k} className={order.includes(k) ? "on" : ""} onClick={() => setOrder(order.includes(k) ? order.filter((x) => x !== k) : [...order, k])}>
            {order.includes(k) ? `${order.indexOf(k) + 1}. ` : ""}{label}
          </button>
        ))}
        <button className="primary" disabled={busy} onClick={run}>{busy ? "Executing…" : "Execute on fork"}</button>
      </div>
      {live && <LiveResult live={live} alone={alone} />}
    </section>
  );
}

function LiveResult({ live, alone }: { live: any; alone?: bigint }) {
  if (live.error) return <div className="bad" style={{ marginTop: 8 }}>{live.error}</div>;
  const res = live.result.results as any[];
  return (
    <div className="steps" style={{ marginTop: 10 }}>
      {res.map((a, i) => {
        if (a.type === "exit") return (
          <div key={i} className="step"><span className="k">tx {a.result.k}</span><span>{a.label} <span className="muted mono">{a.result.call}</span></span>
            <span>{a.result.ok ? <span className="ok">✓ {w(a.result.assetsOutWei, 4)}</span> : <span className="bad">✗ {a.result.error?.selector} {a.result.error?.name}</span>}</span></div>);
        if (a.type === "measure") return (
          <div key={i} className="step"><span className="k">read</span><span className="muted">{a.label}: vault {w(a.m.vaultTotalAssets)} · holder value {w(a.m.holderValue, 4)}</span>
            <span>max withdraw <b>{w(a.m.holderMaxWithdraw, 4)}</b>{alone && a.label.startsWith("before") ? <span className="muted"> ({(Number((BigInt(a.m.holderMaxWithdraw) - alone) * 10000n / alone) / 100).toFixed(1)}%)</span> : null}</span></div>);
        if (a.type === "oraclePrice") return <div key={i} className="step"><span className="k">set</span><span>{a.label} <Chip k="hyp" /></span><span className="mono muted">{a.priceBefore.slice(0, 8)}… → {a.priceAfter.slice(0, 8)}…</span></div>;
        if (a.type === "publicReallocate") return <div key={i} className="step"><span className="k">tx</span><span>{a.label} ({a.withdrawals.length} source markets)</span><span>{a.ok ? <span className="ok">✓ moved {w(a.moved)}</span> : <span className="bad">✗ {a.error?.name}</span>}</span></div>;
        if (a.type === "liquidateAll") return <div key={i} className="step"><span className="k">{a.liquidated} tx</span><span>{a.label}</span><span>repaid {w(a.repaidAssets)} · bad debt <b className="bad">{w(a.badDebtRealised, 3)}</b></span></div>;
        return null;
      })}
      <div className="muted">{live.result.txCount} local transactions in {live.ms} ms · timestamps T0 + 12·k · fork reverted to the source snapshot afterwards</div>
    </div>
  );
}

function Shocks({ r, sel, setSel }: { r: Report; sel: number | null; setSel: (i: number | null) => void }) {
  const [kind, setKind] = useState<string>("all");
  const [busy, setBusy] = useState(false);
  const [live, setLive] = useState<any>(null);
  const rows = (r.sweep as any[]).map((x, i) => ({ ...x, i })).filter((x) => kind === "all" || x.kind === kind);
  const selRow = sel !== null ? r.sweep[sel] : null;
  const exec = async () => {
    if (!selRow || selRow.kind !== "feed") return;
    setBusy(true); setLive(null);
    try { setLive(await api("/api/run", { vault: r.target.vault, holder: r.target.holder, shock: { feed: selRow.node, factor: selRow.factor }, exits: [] })); } catch (e) { setLive({ error: String(e) }); }
    setBusy(false);
  };
  return (
    <section className="panel">
      <h2><span className="n">5</span> Shocks: propagate a failure through the stack <Chip k="hyp" /></h2>
      <p className="sub">A shock hits one discovered dependency (feed, collateral market price, oracle) and follows the discovered links only: feed → oracle (active router leg) → market → borrowers → vault → holder. Value loss = bad debt Morpho Blue socialises to lenders when all collateral of insolvent borrowers is seized. Liquidations repay debt, so they also bring idle liquidity back. Assumptions: every unhealthy borrower is liquidated, no top-ups, instantaneous move.</p>
      <div className="row" style={{ marginBottom: 8 }}>
        {[["all", "All"], ["feed", "Price feed moves (oracle sees it)"], ["blindDepeg", "Market depeg (oracle blind)"], ["oracleOverprice", "Oracle overprices"]].map(([k, l]) => <button key={k} className={kind === k ? "on" : ""} onClick={() => setKind(k)}>{l}</button>)}
      </div>
      <div style={{ maxHeight: 380, overflow: "auto" }}>
        <table>
          <thead><tr><th>Shock</th><th>Markets reached (oracle sees)</th><th className="r">Liquidatable</th><th className="r">Vault loss recognised</th><th className="r">Vault economic shortfall</th><th className="r">Holder loss</th><th className="r">Vault withdrawable after</th><th className="r" title="Liquidations limited by the AMM depth measured at the block">If AMM depth limits liquidations: liquidated / stuck · recognised + unrecognised loss</th></tr></thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.i} className={`click ${sel === x.i ? "sel" : ""}`} onClick={() => setSel(sel === x.i ? null : x.i)}>
                <td>{x.label}</td>
                <td className="muted">{x.markets.map((m: any) => `${m.label.split(" (")[0]} ×${m.factorSeen.toFixed(3)}`).join("; ")}</td>
                <td className="r">{x.markets.reduce((s: number, m: any) => s + m.liquidatable, 0)}</td>
                <td className={`r ${BigInt(x.vaultLoss) > 0n ? "bad" : ""}`}>{w(x.vaultLoss)} <span className="muted">({x.vaultLossPct.toFixed(2)}%)</span></td>
                <td className={`r ${BigInt(x.vaultHiddenLoss) > 0n ? "warn" : ""}`}>{w(x.vaultHiddenLoss)}</td>
                <td className="r">{w(BigInt(x.holderLoss) + BigInt(x.holderHiddenLoss))}</td>
                <td className="r">{w(x.withdrawableAfter)}</td>
                <td className="r">{x.dexLimited ? <>{x.dexLimited.liquidated} / <span className={x.dexLimited.unliquidated ? "warn" : ""}>{x.dexLimited.unliquidated}</span> · {w(x.dexLimited.vaultLoss)} + <span className="warn">{w(x.dexLimited.vaultHiddenLoss)}</span></> : <span className="muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selRow && (
        <div style={{ marginTop: 10 }} className="grid">
          <div><b>Propagation path</b> (highlighted in red in section 3):
            <ul style={{ margin: "4px 0", paddingLeft: 18 }}>{selRow.markets.map((m: any) => <li key={m.id}>{m.path.join(" → ")} · liquidatable {m.liquidatable} · bad debt {w(m.badDebt)} · repaid {w(m.repaid)}{BigInt(m.hiddenShortfall) > 0n ? ` · unrecognised shortfall ${w(m.hiddenShortfall)}` : ""}</li>)}</ul>
          </div>
          <div className="note">{selRow.hypotheses.join(" ")}</div>
          {selRow.kind === "feed" && <div className="row"><button className="primary" disabled={busy} onClick={exec}>{busy ? "Executing liquidations on fork…" : "Execute this shock on the fork"}</button><span className="muted">replaces the oracle by a constant (shock hypothesis) and liquidates every unhealthy borrower, one real transaction each</span></div>}
          {live && <LiveResult live={live} />}
        </div>
      )}
      {r.dex && Object.keys(r.dex).length > 0 && <>
        <h3 style={{ fontSize: 14, margin: "14px 0 6px" }}>AMM layer: can liquidators sell what they seize? <Chip k="onchain" /></h3>
        <p className="sub">Pools discovered on-chain (Uniswap V3 factory, Curve registry, through the unwrapped underlying, and two hops via WETH). Lower bound: direct pools add up, only the best two-hop route counts, aggregators and other DEXes are not included. Capacity per venue = largest amount whose quoted proceeds at the block still cover what the liquidator repays (oracle price / liquidation incentive). Beyond it, liquidating is unprofitable: insolvent positions stay, losses stay unrecognised and no liquidity comes back.</p>
        <table>
          <thead><tr><th>Market</th><th className="r">Collateral posted by borrowers</th><th className="r">Absorbable at a profit</th><th>Venues with capacity (capacity · avg price)</th></tr></thead>
          <tbody>{Object.entries(r.dex).map(([id, d]: [string, any]) => {
            const q = r.queue.find((x: any) => x.id === id);
            const cd = q?.collateralDecimals ?? 18;
            return (<tr key={id}><td>{q?.collateral} #{q?.index}</td><td className="r">{w(d.collateralAtRisk, 2, cd)}</td>
              <td className={`r ${BigInt(d.capacity) < BigInt(d.collateralAtRisk) ? "warn" : "ok"}`}>{w(d.capacity, 2, cd)} ({pct(Number(BigInt(d.capacity) * 1000n / (BigInt(d.collateralAtRisk) || 1n)) / 1000, 0)})</td>
              <td className="muted">{d.venues.map((v: any) => `${v.route}: ${w(v.capacity, 1, cd)} @ ${v.avgPrice?.toFixed(4) ?? "?"}`).join(" · ")}</td></tr>);
          })}</tbody>
        </table>
      </>}
      <h3 style={{ fontSize: 14, margin: "14px 0 6px" }}>Cross-check: analytic engine vs execution on the fork <Chip k="fork" /></h3>
      <table>
        <thead><tr><th>Shock</th><th className="r">Liquidations (exec / analytic)</th><th className="r">Bad debt executed</th><th className="r">Bad debt analytic</th><th className="r">Vault loss executed</th><th className="r">Vault loss analytic</th><th className="r">Holder value loss (exec)</th></tr></thead>
        <tbody>{r.crossCheck.map((c: any) => (
          <tr key={c.id}><td>{c.label}</td><td className="r">{c.executedLiquidations} / {c.analyticLiquidatable}</td><td className="r">{w(c.executedBadDebt, 3)}</td><td className="r">{w(c.analyticBadDebt, 3)}</td><td className="r">{w(c.executedVaultLoss, 3)}</td><td className="r">{w(c.analyticVaultLoss, 3)}</td><td className="r bad">{w(c.executedHolderValueLoss, 3)}</td></tr>
        ))}</tbody>
      </table>
      <p className="muted" style={{ fontSize: 12 }}>{r.crossCheck[0]?.note}</p>
    </section>
  );
}

function VerdictPanel({ r }: { r: Report }) {
  if (!r.incidents?.length) return (
    <section className="panel">
      <h2><span className="n">2</span> Decision: stay or exit?</h2>
      <p className="sub">No incident could be built for this vault: none of the markets it supplies has a collateral, an oracle that answers and identified borrowers, so there is no price shock to propagate. Exit liquidity results above still apply.</p>
    </section>
  );
  return <VerdictBody r={r} />;
}

function VerdictBody({ r }: { r: Report }) {
  const d = r.verdictParams.defaults;
  const [inc, setInc] = useState(0);
  const [p, setP] = useState<number>(d.probability);
  const [h, setH] = useState<number>(d.horizonDays);
  const [hc, setHc] = useState<number>(d.lockedHaircut);
  const I = r.incidents[inc];
  const inputs = {
    positionValue: BigInt(I.inputs.positionValue), exitableNow: BigInt(I.inputs.exitableNow),
    incidentValueLoss: BigInt(I.inputs.incidentValueLoss), incidentLocked: BigInt(I.inputs.incidentLocked),
    lockedHaircut: hc, netApy: r.verdictParams.netApy, horizonDays: h,
    gasCostOut: BigInt(r.verdictParams.gasCostOut), gasCostReentry: BigInt(r.verdictParams.gasCostReentry), slippage: BigInt(r.verdictParams.slippage), probability: p,
  };
  const dec = r.target.assetDecimals;
  const v = decide(scaleTo18(inputs, dec), r.target.assetSymbol);
  const f = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 2 });
  return (
    <section className="panel">
      <h2><span className="n">2</span> Decision: stay or exit?</h2>
      <p className="sub">Expected loss if you stay = p × incident loss. Exit cost = forgone yield on what can leave now + gas out and back (gas used on the fork × base fee of the block) + measured slippage. The break-even probability is where both are equal. <b>p is your assumption, not a prediction.</b></p>
      <div className="row" style={{ marginBottom: 10 }}>
        {r.incidents.map((x: any, i: number) => <button key={x.id} className={inc === i ? "on" : ""} onClick={() => setInc(i)}>{x.title}</button>)}
      </div>
      <div className="note" style={{ marginBottom: 10 }}>Regime: {I.regime}. Value loss source: {I.valueSource}. After the run, the holder could withdraw at most <b>{w(I.executedFacts.holderMaxWithdrawAfterRun)}</b> <Chip k="fork" />{I.executedFacts.liquidatableFoundOnFork !== undefined ? <> · liquidation sweep on the fork found <b>{I.executedFacts.liquidatableFoundOnFork}</b> liquidatable positions (oracle unchanged)</> : null}{I.executedFacts.leftInsolvent !== undefined ? <> · <b>{I.executedFacts.liquidatedOnFork}</b> liquidations executed, <b>{I.executedFacts.leftInsolvent}</b> insolvent positions left (AMM depth exhausted)</> : null}.</div>
      <div className="grid" style={{ gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)" }}>
        <div className="grid">
          <div className="slider"><span>Incident probability within horizon <Chip k="hyp" /></span><input type="range" min={0} max={0.3} step={0.0025} value={p} onChange={(e) => setP(Number(e.target.value))} /><b>{pct(p, 2)}</b></div>
          <div className="slider"><span>Horizon (days) <Chip k="hyp" /></span><input type="range" min={1} max={365} step={1} value={h} onChange={(e) => setH(Number(e.target.value))} /><b>{h} d</b></div>
          <div className="slider"><span>Cost of a locked unit <Chip k="hyp" /></span><input type="range" min={0} max={1} step={0.05} value={hc} onChange={(e) => setHc(Number(e.target.value))} /><b>{pct(hc, 0)}</b></div>
          <table>
            <tbody>
              <tr><td>Position value <Chip k="onchain" /></td><td className="r">{w(I.inputs.positionValue)}</td></tr>
              <tr><td>Exitable now <Chip k="fork" /></td><td className="r">{w(I.inputs.exitableNow)} ({pct(v.exitableShare)})</td></tr>
              <tr><td>Incident value loss</td><td className="r bad">{f(v.parts.valueLoss)}</td></tr>
              <tr><td>Locked after the run <Chip k="fork" /> × cost of locked</td><td className="r">{f(v.parts.lockedAfterRun)} × {pct(hc, 0)}</td></tr>
              <tr><td><b>Incident loss L</b></td><td className="r"><b>{f(v.incidentLoss)}</b></td></tr>
              <tr><td>Forgone yield ({pct(r.verdictParams.netApy, 2)} net APY <Chip k="onchain" />, {h} d)</td><td className="r">{f(v.parts.forgoneYield)}</td></tr>
              <tr><td>Gas out + back in ({Number(r.verdictParams.exitGasUsed).toLocaleString()} gas × {(Number(r.verdictParams.baseFeePerGas) / 1e9).toFixed(3)} gwei){r.verdictParams.gasNote ? <div className="muted" style={{ fontSize: 11 }}>{r.verdictParams.gasNote}: {(2 * Number(r.verdictParams.gasOutEth) / 1e18).toFixed(6)} ETH</div> : null}</td><td className="r">{(v.parts.gasOut + v.parts.gasReentry).toFixed(6)}</td></tr>
              <tr><td>Slippage (value − received, measured) <Chip k="fork" /></td><td className="r">{v.parts.slippage.toFixed(6)}</td></tr>
              <tr><td><b>Exit cost</b></td><td className="r"><b>{f(v.exitCost)}</b></td></tr>
            </tbody>
          </table>
        </div>
        <div className="grid">
          <ProbTriple r={r} v={v} h={h} p={p} />
          <div className={`verdict ${v.decision}`}>
            <div className="d">{v.decision === "NO_ACTION_POSSIBLE" ? "CANNOT EXIT" : v.decision}</div>
            <div style={{ margin: "6px 0" }}>Break-even incident probability: <b>{v.breakEvenProbability === null ? "—" : v.breakEvenProbability > 1 ? ">100%" : pct(v.breakEvenProbability, 2)}</b> within {h} days</div>
            <div className="mono" style={{ fontSize: 12, margin: "4px 0 8px", padding: "6px 8px", background: "#0b0e13", borderRadius: 6 }}>
              computed with: horizon <b>{h} d</b> · yield given up <b>{pct(r.verdictParams.netApy, 2)}</b> net APY <Chip k="onchain" /> (supply APR of the vault's markets weighted by its supply, minus the {pct(Number(r.vault.vaultPerformanceFee), 0)} performance fee, at the block) · locked funds cost <b>{pct(hc, 0)}</b> <Chip k="hyp" /> · exitable now {pct(v.exitableShare)} <Chip k="fork" />
            </div>
            <div>{v.sentence}</div>
            <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>Expected loss: stay {f(v.expectedLossStay)} vs exit {f(v.expectedLossExit)} {r.target.assetSymbol}</div>
          </div>
          <BreakEvenChart curve={r.depegCurve} coll={r.depegCurveCollateral} h={h} p={p} inc={inc} />
          <div>
            <b>Sensitivity of the break-even</b> (horizon × cost of locked funds)
            <table><thead><tr><th>Horizon</th><th className="r">locked 0%</th><th className="r">10%</th><th className="r">50%</th></tr></thead>
              <tbody>{[7, 30, 90].map((hd) => (
                <tr key={hd}><td>{hd} d</td>{[0, 0.1, 0.5].map((x) => <td key={x} className="r">{pct(decide(scaleTo18({ ...inputs, horizonDays: hd, lockedHaircut: x }, dec)).breakEvenProbability, 2)}</td>)}</tr>
              ))}</tbody></table>
          </div>
        </div>
      </div>
    </section>
  );
}

function BreakEvenChart({ curve, inc, coll }: { curve: any[]; coll: string | null; h: number; p: number; inc: number }) {
  if (inc !== 0 || !curve?.length || curve.every((c) => c.breakEven === null)) return null;
  const W = 420, H = 150, pad = 34;
  const pts = curve.filter((c) => c.breakEven !== null);
  const maxY = Math.max(...pts.map((c) => c.breakEven));
  const x = (f: number) => pad + ((1 - f) / 0.2) * (W - pad - 10);
  const y = (b: number) => H - pad + 6 - (b / maxY) * (H - pad - 10);
  return (
    <div>
      <b>Break-even vs size of the {coll} depeg</b> <span className="muted">(oracle-blind regime, defaults: 30 d, locked 10%)</span>
      <svg width={W} height={H} style={{ display: "block" }}>
        <line x1={pad} y1={H - pad + 6} x2={W - 10} y2={H - pad + 6} stroke="#2a323d" />
        <line x1={pad} y1={10} x2={pad} y2={H - pad + 6} stroke="#2a323d" />
        <polyline fill="none" stroke="#4ea1ff" strokeWidth={2} points={pts.map((c) => `${x(c.factor)},${y(c.breakEven)}`).join(" ")} />
        {pts.map((c) => { const lab = [0.99, 0.97, 0.95, 0.9, 0.85, 0.8].includes(c.factor); return <g key={c.factor}><circle cx={x(c.factor)} cy={y(c.breakEven)} r={3} fill="#4ea1ff" />{lab && <text x={x(c.factor)} y={H - 8} fontSize={10} fill="#8b98a5" textAnchor="middle">-{Math.round((1 - c.factor) * 100)}%</text>}{[0.99, 0.95, 0.9, 0.8].includes(c.factor) && <text x={x(c.factor)} y={y(c.breakEven) - 6} fontSize={10} fill="#e6edf3" textAnchor="middle">{(c.breakEven * 100).toFixed(2)}%</text>}</g>; })}
      </svg>
    </div>
  );
}

const CLS: Record<string, [string, string]> = {
  measured: ["onchain", "measured on-chain"], executed: ["fork", "executed on fork"], bounded: ["bounded", "bounded"],
  modeled: ["modeled", "modeled"], hypothesis: ["hyp", "hypothesis"],
};

function ProbTriple({ r, v, h, p }: { r: Report; v: any; h: number; p: number }) {
  const V = Number(BigInt(r.target.holderValue)) / 10 ** r.target.assetDecimals;
  const lossFrac = V > 0 ? v.incidentLoss / V : 0;
  const netApy = r.verdictParams.netApy;
  // "holding idle" is not shown: against it, the spread-implied probability equals the break-even by construction
  const refs = ((r.references ?? []) as { name: string; apy: number; source: string; note: string }[]).filter((x) => x.apy !== 0);
  const implied = (ref: { apy: number }) => { const sp = netApy - ref.apy; return sp <= 0 || lossFrac <= 0 ? null : Math.min(1, (sp * h) / 365 / lossFrac); };
  const be = v.breakEvenProbability;
  return (
    <div className="kpis" style={{ gridTemplateColumns: "repeat(3, minmax(0,1fr))" }}>
      <div className="kpi"><div className="l">Break-even p* <Chip k="fork" /></div>
        <div className="v">{be === null ? "—" : be > 1 ? ">100%" : pct(be, 2)}</div>
        <div className="muted" style={{ fontSize: 12 }}>above it, exiting now beats staying ({h} d)</div></div>
      <div className="kpi"><div className="l">Implied by the yield spread <Chip k="hyp" /></div>
        {refs.map((ref) => {
          const x = implied(ref);
          return <div key={ref.name} style={{ fontSize: 13, margin: "3px 0" }} title={`${ref.source}. ${ref.note}`}>
            vs {ref.name} ({Number.isFinite(ref.apy) ? pct(ref.apy, 2) : "n/a"}): <b>{x === null ? (netApy - ref.apy <= 0 ? "spread ≤ 0, prices no default risk" : "—") : pct(x, 2)}</b></div>;
        })}
        {!refs.length && <div style={{ fontSize: 13 }}>no sourced reference yield for {r.target.assetSymbol}</div>}
        <div className="muted" style={{ fontSize: 11 }}>(net APY {pct(netApy, 2)} − reference) × {h}/365 ÷ loss fraction {pct(lossFrac, 1)}. Risk-neutral, includes liquidity and smart-contract premia: not a prediction. Against holding the asset idle it would essentially equal the break-even (same yield given up, same loss), so it is not shown.</div></div>
      <div className="kpi"><div className="l">Your assumption <Chip k="hyp" /></div>
        <div className="v">{pct(p, 2)}</div>
        <div className="muted" style={{ fontSize: 12 }}>slider on the left; no historical incident frequency is shown (none could be sourced with date and sample)</div></div>
    </div>
  );
}

function Evidence({ r }: { r: Report }) {
  if (!r.evidence) return null;
  return (
    <section className="panel">
      <h2><span className="n">7</span> Evidence ledger: measured, executed, bounded, modeled</h2>
      <p className="sub">Every headline number, how it was obtained and what it assumes. <b>Measured</b> = read on-chain at the block. <b>Executed</b> = real contract calls on the local fork. <b>Bounded</b> = a measured upper or lower bound. <b>Modeled</b> = computed from measured inputs with the stated hypotheses. <b>Hypothesis</b> = your input.</p>
      <table>
        <thead><tr><th>Item</th><th>Value</th><th>Class</th><th>Source</th><th>Hypotheses</th></tr></thead>
        <tbody>{r.evidence.map((e: any, i: number) => (
          <tr key={i}><td>{e.item}</td><td className="mono">{e.value}</td><td><span className={`chip ${CLS[e.cls][0]}`}>{CLS[e.cls][1]}</span></td><td className="muted" style={{ fontSize: 12 }}>{e.source}</td><td className="muted" style={{ fontSize: 12 }}>{e.hypotheses}</td></tr>
        ))}</tbody>
      </table>
    </section>
  );
}

function Proofs({ r }: { r: Report }) {
  const [m, setM] = useState<any>(null);
  const [last, setLast] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [log, setLog] = useState("");
  useEffect(() => { api(`/api/manifest?vault=${r.target.vault}`).then(setM); api(`/api/replay-last?vault=${r.target.vault}`).then(setLast); }, [r.target.vault]);
  const replay = async () => {
    setBusy(true); setLog("");
    try { const o: any = await api(`/api/replay?vault=${r.target.vault}`, {}); setLog(o.log); setLast(o.replay); } catch (e) { setLog(String(e)); }
    setBusy(false);
  };
  return (
    <section className="panel">
      <h2><span className="n">8</span> Proof: replayable to the wei, offline <Chip k="fork" /></h2>
      <p className="sub">Every scenario above is recorded in a manifest (inputs, timestamps T0+12·k, expected amounts, statuses and decoded errors). Replay re-executes them on a fresh fork and compares to the wei; transaction hashes are not compared. Works without Internet once the proxy cache is warm.</p>
      {m && <div className="kv mono" style={{ marginBottom: 10 }}>
        <div className="k">manifest sha256</div><div>{m.sha256}</div>
        <div className="k">source</div><div>chainId {m.source.chainId} · block {m.source.block} · {m.source.blockHash}</div>
        <div className="k">convention</div><div>{m.convention}</div>
        <div className="k">scenarios</div><div>{m.scenarios.length}{m.cushion ? ` + cushion bisection (${m.cushion.probes.length} executions)` : ""}</div>
        <div className="k">tooling</div><div>node {m.tooling.node} · hardhat {m.tooling.hardhat} · viem {m.tooling.viem}</div>
      </div>}
      <div className="row">
        <button className="primary" disabled={busy} onClick={replay}>{busy ? "Replaying on the fork…" : "Replay everything now"}</button>
        {last?.verdict && <span className={last.verdict === "REPLAY OK" ? "ok" : "bad"}><b>{last.verdict}</b> · {last.scenarios?.length} scenarios · cushion {last.cushionOk ? "OK" : "FAIL"} · hash {last.hashOk ? "OK" : "FAIL"} · {last.at}</span>}
        <a href={`/api/manifest?vault=${r.target.vault}`} target="_blank" rel="noreferrer">manifest.json</a>
        <a href={`/api/graph/${r.target.vault}`} target="_blank" rel="noreferrer">dependency graph JSON</a>
      </div>
      {log && <div className="log mono" style={{ marginTop: 8 }}>{log}</div>}
    </section>
  );
}
