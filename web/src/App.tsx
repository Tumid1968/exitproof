import { useContext, useState } from "react";
import { ModeCtx } from "./mode";
import { api, etherscan, pct, short, w, type Graph, type Report } from "./lib";

export const Chip = ({ k }: { k: "onchain" | "fork" | "hyp" | "offchain" }) => (
  <span className={`chip ${k}`}>{{ onchain: "on-chain", fork: "fork", hyp: "hypothesis", offchain: "off-chain list" }[k]}</span>
);

export function Position({ r }: { r: Report }) {
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

export function Findings({ g }: { g: Graph }) {
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

export function shockNodes(g: Graph, row: any): Set<string> {
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

export function Runs({ r }: { r: Report }) {
  const mode = useContext(ModeCtx);
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
                <td className={`r ${x.changePct < 0 ? "bad" : "muted"}`}>{x.changePct === 0 ? "—" : `${x.changePct.toFixed(2)}%`}</td>
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
      {mode === "live" ? <>
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
      </> : <p className="muted" style={{ fontSize: 12 }}>Running other orders live requires the local fork (static replay: see README, "Run it").</p>}
    </section>
  );
}

export function LiveResult({ live, alone }: { live: any; alone?: bigint }) {
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

export function Shocks({ r, sel, setSel }: { r: Report; sel: number | null; setSel: (i: number | null) => void }) {
  const mode = useContext(ModeCtx);
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
          {selRow.kind === "feed" && mode === "live" && <div className="row"><button className="primary" disabled={busy} onClick={exec}>{busy ? "Executing liquidations on fork…" : "Execute this shock on the fork"}</button><span className="muted">replaces the oracle by a constant (shock hypothesis) and liquidates every unhealthy borrower, one real transaction each</span></div>}
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

export function BreakEvenChart({ curve, inc, coll }: { curve: any[]; coll: string | null; h: number; p: number; inc: number }) {
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
        <line x1={pad} y1={H - pad + 6} x2={W - 10} y2={H - pad + 6} style={{ stroke: "var(--line)" }} />
        <line x1={pad} y1={10} x2={pad} y2={H - pad + 6} style={{ stroke: "var(--line)" }} />
        <polyline fill="none" stroke="#4ea1ff" strokeWidth={2} points={pts.map((c) => `${x(c.factor)},${y(c.breakEven)}`).join(" ")} />
        {pts.map((c) => { const lab = [0.99, 0.97, 0.95, 0.9, 0.85, 0.8].includes(c.factor); return <g key={c.factor}><circle cx={x(c.factor)} cy={y(c.breakEven)} r={3} fill="#4ea1ff" />{lab && <text x={x(c.factor)} y={H - 8} fontSize={10} style={{ fill: "var(--muted)" }} textAnchor="middle">-{Math.round((1 - c.factor) * 100)}%</text>}{[0.99, 0.95, 0.9, 0.8].includes(c.factor) && <text x={x(c.factor)} y={y(c.breakEven) - 6} fontSize={10} style={{ fill: "var(--text)" }} textAnchor="middle">{(c.breakEven * 100).toFixed(2)}%</text>}</g>; })}
      </svg>
    </div>
  );
}

const CLS: Record<string, [string, string]> = {
  measured: ["onchain", "measured on-chain"], executed: ["fork", "executed on fork"], bounded: ["bounded", "bounded"],
  modeled: ["modeled", "modeled"], hypothesis: ["hyp", "hypothesis"],
};

export function Evidence({ r }: { r: Report }) {
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

