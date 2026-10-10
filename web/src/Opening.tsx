/**
 * Opening screen for someone who has never seen the project. Display only: every number is read from
 * the exported report (same values as the detailed tabs); nothing is computed here except formatting.
 */
import { useEffect, useMemo, useState } from "react";
import { apiPost, type IndexEntry, type Mode } from "./data";
import { pct, w } from "./lib";

const fmtP = (x: number | null | undefined) => (x === null || x === undefined ? "—" : x > 1 ? "never" : pct(x, 2));
const NM = "not measured";
/** keep a number and its % on the same line */
const nb = (t: string) => t.replace(/ %/g, "\u00a0%");

/** The three kinds of number, as small pills with a one-line meaning (tap to read it). */
const LETTER = { fork: "F", modeled: "M", hyp: "A", hist: "H" } as const;
const TAGS = {
  fork: ["measured on fork", "Executed on a copy of Ethereum frozen at block 26,157,638: real contracts, real state, simulated transactions."],
  modeled: ["modeled", "Computed from measured data with stated assumptions; a lower bound, not a measurement."],
  hyp: ["your assumption", "A choice you make (probability, cost of locked funds). Nothing here predicts it."],
  hist: ["historical reference", "Past prices read from the chain at block 26,157,638. What happened before, not a forecast."],
} as const;
export function Tag({ k }: { k: keyof typeof TAGS }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`tag tag-${k}`}>
      <button type="button" className="tagbtn" aria-expanded={open} onClick={() => setOpen(!open)} title={TAGS[k][1]}><span className="tagpill"><span className="tagletter" aria-hidden="true">{LETTER[k]}</span>{TAGS[k][0]}</span></button>
      {open && <span className="tip" role="tooltip">{TAGS[k][1]}</span>}
    </span>
  );
}

/** Plain-words definition of the decisive incident, from its title (wording only). */
export function incidentDefinition(title: string | undefined): string | null {
  if (!title) return null;
  const blind = /^Incident: (\S+) depegs/.exec(title);
  if (blind) return `Incident = the ${blind[1]} price drops on the market but the vault's oracle does not see it, and big holders leave first.`;
  const feed = /^Incident: (.+?) -10%/.exec(title);
  if (feed && /AMM/.test(title)) return `Incident = ${feed[1]} falls by 10 %, the oracle sees it, liquidations are limited by what the exchanges can absorb, and big holders leave first.`;
  if (feed) return `Incident = ${feed[1]} falls by 10 % and the oracle sees it: borrowers are liquidated, and big holders leave first.`;
  return null;
}

export function HowToRead({ onClose }: { onClose: () => void }) {
  return (
    <div className="howto" role="dialog" aria-label="How to read this page">
      <p>1. The big number is what you could actually withdraw from this vault, executed on a frozen copy of Ethereum, depending on who leaves before you.</p>
      <p>2. “Should I leave?” compares the yield you would give up with what an incident would cost you, and gives the chance of an incident above which leaving pays off.</p>
      <p>3. The chance itself is yours to judge: nothing here predicts it, and the pills say whether each number is measured, modeled or your assumption.</p>
      <button className="pill ghostpill" onClick={onClose}>Got it</button>
    </div>
  );
}

type Run = any;
const who = (r: any, x: Run) => x.others.map((o: any) => {
  const m = /^holder #(\d+) exits(?: (Gauntlet.*|this vault))?/.exec(o.label);
  if (o.vault !== r.target.vault) {
    const name = /^(.*?) #1 exits its own vault/.exec(o.label)?.[1];
    return name ? `the largest depositor of ${name} (another vault)` : `holder #${m?.[1] ?? "?"} leaving another vault`;
  }
  return m ? `holder #${m[1]}` : o.label;
}).join(", then ");

/** Five scenarios, picked from the executed runs (worst case of each kind). */
function pickScenarios(r: any) {
  const runs: Run[] = r.runs;
  const inV = (x: Run) => x.others.every((o: any) => o.vault === r.target.vault);
  const worst = (xs: Run[]) => [...xs].sort((a, b) => a.changePct - b.changePct)[0];
  const out: { key: string; label: string; run: Run }[] = [{ key: "alone", label: "Alone", run: runs[0] }];
  const one = worst(runs.filter((x) => x.others.length === 1 && inV(x)));
  const two = worst(runs.filter((x) => x.others.length >= 2 && inV(x)));
  const other = worst(runs.filter((x) => x.others.length === 1 && !inV(x)));
  const both = worst(runs.filter((x) => x.others.length >= 2 && !inV(x)));
  if (one) out.push({ key: "one", label: "One holder before me", run: one });
  if (two) out.push({ key: "two", label: "Two holders", run: two });
  if (other) out.push({ key: "other", label: "Another vault", run: other });
  if (both) out.push({ key: "both", label: "Both vaults", run: both });
  return out;
}

export function ExitPanel({ r, entry, mode, pick, refine, g }: { r: any; entry?: IndexEntry; mode: Mode; pick: number; refine?: any; g?: any }) {
  const scenarios = useMemo(() => pickScenarios(r), [r]);
  const [sel, setSel] = useState(0);
  // "See it in action" (pick > 0): show the depositor of another vault leaving first
  useEffect(() => { if (pick > 0) { const i = scenarios.findIndex((x) => x.key === "other"); setSel(i >= 0 ? i : Math.min(1, scenarios.length - 1)); } }, [pick]);
  const [details, setDetails] = useState(false);
  const [live, setLive] = useState<string | null>(null);
  useEffect(() => { setSel(0); setDetails(false); setLive(null); }, [r]);
  const s = scenarios[Math.min(sel, scenarios.length - 1)];
  const run = s.run;
  const value = BigInt(r.target.holderValue);
  const share = Number(BigInt(run.holderExecutedExit) * 10000n / (value || 1n)) / 100;
  const full = run.fullExitOk;
  const u = r.target.assetSymbol;
  const sentence = s.key === "alone"
    ? full ? "Nobody leaves before you: you can take out everything." : `Even alone, the vault does not have enough cash available: you can take out ${share.toFixed(0)} % of your position.`
    : full ? `If ${who(r, run)} ${run.others.length > 1 ? "leave" : "leaves"} first, you can still take out everything.`
      : `If ${who(r, run)} ${run.others.length > 1 ? "leave" : "leaves"} first, the vault does not have enough cash available: you can take out only ${share.toFixed(0)} % of your position.`;
  const runLive = async () => {
    setLive("executing on the fork…");
    try {
      const o: any = await apiPost("/api/run", { vault: r.target.vault, holder: r.target.holder, exits: run.others.map((x: any) => ({ vault: x.vault, owner: x.owner, label: x.label })) });
      const ex = o.result.results.filter((x: any) => x.type === "exit" && x.result.owner === r.target.holder);
      const out = ex[0].result.ok ? ex[0].result.assetsOutWei : ex[1]?.result.assetsOutWei ?? "0";
      setLive(`${w(out, 6)} ${u} in ${o.ms} ms ${out === run.holderExecutedExit ? "— identical to the wei" : "— DIFFERENT from the recorded value"}`);
    } catch (e) { setLive(String((e as Error).message)); }
  };
  return (
    <section className="exitpanel glass sr">
      <p className="eyebrow">What you really get back</p>
      <p className="context">{r.target.name} · the {r.target.holderLabel}'s position of <b>{w(r.target.holderValue)} {u}</b> · block 26,157,638</p>
      <div className="bignum" aria-live="polite">
        <div key={s.key + run.holderExecutedExit} className={`amount ${full ? "good" : "bad"}`}>{w(run.holderExecutedExit)} <span className="unit">{u}</span></div>
        <div className="delta">{s.key === "alone" ? (full ? "100 % of your position" : `${share.toFixed(0)} % of your position`) : `${run.changePct === 0 ? "±0.00" : run.changePct.toFixed(2)} % vs exiting alone`} <Tag k="fork" /></div>
        <p className="exitwin"><b>Exit window:</b> {full ? "Immediate" : <>Partial: {share.toFixed(0)}&nbsp;% now, the rest when borrowers repay or the curator reallocates</>} <Tag k="fork" /></p>
        {refine?.governance && <p className="exitwinsub">{governanceLine(refine.governance)}</p>}
        {s.key === "other" && (() => {
          const peer = g?.peers?.find((p: any) => p.vault.toLowerCase() === run.others[0]?.vault?.toLowerCase());
          if (!peer) return null;
          const shared = peer.markets.filter((pm: any) => BigInt(pm.supplyAssets) > 0n).map((pm: any) => g.markets.find((m: any) => m.id === pm.id && BigInt(m.vaultSupplyAssets) > 0n)).filter(Boolean);
          if (!shared.length) return null;
          const syms = [...new Set(shared.map((m: any) => m.collateralSymbol))].join(" and ");
          return <p className="shared">Your vault and {peer.name} both lend into the same {syms} market{shared.length > 1 ? "s" : ""}. If their depositor leaves, {full ? "less cash is left for you." : "your cash runs out too."}</p>;
        })()}
        <div className="thinbar" role="img" aria-label={`${share.toFixed(0)} % of the position can be withdrawn`}>
          <div className={`fill ${full ? "good" : "bad"}`} style={{ width: `${Math.min(100, share)}%` }} />
        </div>
      </div>
      <div className="pills" role="tablist" aria-label="who leaves before you">
        {scenarios.map((x, i) => <button key={x.key} role="tab" aria-selected={i === sel} className={`pill seg ${i === sel ? "active" : ""}`} onClick={() => { setSel(i); setLive(null); }}>{x.label}</button>)}
      </div>
      <p className="plain">{sentence} {s.key !== "alone" && <Tag k="hyp" />}</p>
      <button className="pill ghostpill" aria-expanded={details} onClick={() => setDetails(!details)}>{details ? "Hide details" : "Details"}</button>
      {details && (
        <div className="detailbox">
          <p><b>What happened, technically.</b> {s.key === "alone" ? "The holder redeems all shares" : `Executed first: ${run.others.map((o: any) => o.label).join(" → ")}; then the holder redeems all shares`}. Full exit: {full ? "succeeds" : <>reverts with <span className="mono">{run.fullExitError?.name ?? NM}</span>{run.fullExitError?.selector ? <> (<span className="mono">{run.fullExitError.selector}</span>)</> : null}: the vault does not have enough cash available; the amount shown is the maximum still withdrawable, executed</>}.</p>
          {r.cushion && (r.cushion.revertsAt !== "none"
            ? <p><b>How much can leave before you without blocking you:</b> {w(r.cushion.passesAt, 3)} {u} (found by bisection on the fork: your full exit passes at {w(r.cushion.passesAt, 3)}, fails at {w(r.cushion.revertsAt, 3)}).</p>
            : <p><b>How much can leave before you without blocking you:</b> even the next largest holder withdrawing everything it can does not block you.</p>)}
          <p className="mono small">{entry?.manifest ? <>manifest sha256 {entry.manifest.sha256} · {entry.manifest.scenarios} scenarios{entry.replay ? ` · replayed to the wei: ${entry.replay.verdict} (${entry.replay.okScenarios}/${entry.replay.scenarios})` : ""}</> : `manifest: ${NM}`}</p>
          {mode === "live"
            ? <><button className="pill primary" onClick={runLive} disabled={live === "executing on the fork…"}>Execute this again on the fork</button>{live && <p className="mono small">{live}</p>}</>
            : <p className="small muted"><button className="pill ghostpill" disabled>Execute this again on the fork</button> needs the local fork, see README (“Live demo”).</p>}
        </div>
      )}
    </section>
  );
}

/** "How often has this shock happened?": raw counts from the on-chain history; never a single forecast. */
function HistoryTile({ refine, history }: { refine?: any; history?: any }) {
  if (!refine?.history || !history) return (
    <div className="stat histtile"><span className="statlabel">How often has this shock happened?</span>
      <span className="statsub">No price history was read for this incident's shock ({NM}).</span></div>
  );
  const size = refine.history.incidentShockSize;
  const rows: any[] = history.windows.bySize;
  const rare = rows.filter((x) => x.k <= 1).length;
  const mon = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  const p = (x: number) => `${(x * 100).toFixed(x < 0.01 ? 2 : 1)}\u00a0%`;
  return (
    <div className="stat histtile">
      <span className="statlabel">How often has this shock happened? <Tag k="hist" /></span>
      <span className="statsub">stETH below ETH by at least … within a 30-day window, {mon(history.period.from)} – {mon(history.period.to)} ({history.windows.count} non-overlapping windows, daily prices of the Chainlink stETH/ETH feed):</span>
      <table className="histtable"><tbody>
        {rows.map((x) => <tr key={x.size} className={Math.abs(x.size - size) < 1e-9 ? "this" : ""}><td>{(x.size * 100).toFixed(0)}&nbsp;%{Math.abs(x.size - size) < 1e-9 ? " (this incident)" : ""}</td><td className="r">{x.k} of {x.n} windows</td></tr>)}
      </tbody></table>
      {rare >= rows.length / 2 && <span className="statsub">{rare} of the {rows.length} sizes happened in 0 or 1 window over this period.</span>}
      <span className="statsub">Worst window: −{p(history.windows.worst.drop)} (from {history.windows.worst.start}). 99th percentile of drops: {p(history.drops.oneDay.p99)} over 1 day, {p(history.drops.thirtyDays.p99)} over 30 days. The market's oracle does not use this feed.</span>
      <span className="statsub"><b>One event is not a distribution. This is a reference, not a forecast.</b></span>
    </div>
  );
}

export function LeaveCard({ r, refine, history }: { r: any; refine?: any; history?: any }) {
  const grid: any[] = r.verdictGrid ?? [];
  const g = grid.find((x) => x.id === r.bindingIncident);
  const [hc, setHc] = useState(0.1);
  const [p, setP] = useState<number | null>(null); // no verdict before the user touches the slider
  const [calc, setCalc] = useState(false);
  // "break it down": p = P(shock) × P(others exit first | shock); the first factor starts at the historical count
  const [split, setSplit] = useState(false);
  const [pa, setPa] = useState<number | null>(null);
  const [pb, setPb] = useState<number | null>(null);
  useEffect(() => { setP(null); setCalc(false); setHc(0.1); setSplit(false); setPa(null); setPb(null); }, [r]);
  const ref = refine?.history && history ? history.windows.bySize.find((x: any) => Math.abs(x.size - refine.history.incidentShockSize) < 1e-9) : null;
  const refP = ref ? ref.k / ref.n : null;
  const a = pa ?? refP;
  const pEff = !split ? p : pb === null || a === null ? null : a * pb;
  const u = r.target.assetSymbol;
  const n = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 2 });
  const c10 = g?.cells.find((c: any) => c.horizonDays === 30 && c.lockedHaircut === 0.1);
  const c0 = g?.cells.find((c: any) => c.horizonDays === 30 && c.lockedHaircut === 0);
  const c = hc === 0.1 ? c10 : c0;
  // wording only: the dependency sentence is the report's own text
  const dominant = /Dominant dependency: (.*?)\.?$/.exec(r.headline ?? "")?.[1] ?? null;
  const reading = !c ? NM : pEff === null ? (split ? "Move the second slider (and the first if you disagree with the reference) to compare." : "Move the slider to compare your own estimate.") : c.decision === "NO_ACTION_POSSIBLE" ? "You cannot leave: less than 1 % of the position can be withdrawn."
    : c.breakEven === null ? "This incident costs you nothing: staying is cheaper." : pEff > c.breakEven ? "With your estimate, leaving pays off." : "With your estimate, staying is cheaper.";
  const vl = refine?.vaultLevel;
  return (
    <section className="card glass sr">
      <h2 className="serif">Should I leave?</h2>
      {g && c10 && c0 ? <>
        {incidentDefinition(r.incidents?.find((i: any) => i.id === g.id)?.title) && <p className="incidentdef">{incidentDefinition(r.incidents.find((i: any) => i.id === g.id).title)}</p>}
        <p className="verdict2">Leaving pays off if you judge this incident more likely than <b>{nb(fmtP(c10.breakEven))}</b> (locked funds cost 10&nbsp;%) or <b>{nb(fmtP(c0.breakEven))}</b> (cost 0&nbsp;%) within 30&nbsp;days.</p>
        <p className="verdict2sub">Incident: {r.shortIncidents?.[g.id] ?? NM}{dominant ? <> · dominant dependency: {dominant}</> : null}</p>
      </> : <p className="verdict2">{nb(r.headline ?? NM)}</p>}
      <p className="honest"><span className="hitem"><Tag k="fork" /> what you can withdraw is measured</span><span className="hitem"><Tag k="modeled" /> the loss in an incident is modeled (lower bound)</span><span className="hitem"><Tag k="hyp" /> the chance of the incident is yours</span>{refine?.history && history ? <span className="hitem"><Tag k="hist" /> past prices, not a forecast</span> : null}</p>
      {!g ? <p className="muted">No incident could be built for this vault, so there is no threshold to show ({NM}).</p> : <>
        <div className="twostats">
          <div className="statwrap"><span className="stattag"><Tag k="hyp" /></span>
          <button className={`stat ${hc === 0.1 ? "chosen" : ""}`} onClick={() => setHc(0.1)} aria-pressed={hc === 0.1}>
            <span className="statlabel">if being locked in costs you 10 %</span>
            <span className="statnum">{fmtP(c10?.breakEven)}</span>
            <span className="statsub">chance of the incident within 30 days above which leaving pays off</span>
          </button></div>
          <div className="statwrap"><span className="stattag"><Tag k="hyp" /></span>
          <button className={`stat ${hc === 0 ? "chosen" : ""}`} onClick={() => setHc(0)} aria-pressed={hc === 0}>
            <span className="statlabel">if being locked in costs you nothing</span>
            <span className="statnum">{fmtP(c0?.breakEven)}</span>
            <span className="statsub">chance of the incident within 30 days above which leaving pays off</span>
          </button></div>
        </div>
        <HistoryTile refine={refine} history={history} />
        <div className="toggle" role="radiogroup" aria-label="cost of locked funds">
          <span className="muted">locked funds cost</span>
          {[0.1, 0].map((x) => <button key={x} role="radio" aria-checked={hc === x} className={`pill seg ${hc === x ? "active" : ""}`} onClick={() => setHc(x)}>{x * 100} %</button>)}
        </div>
        <div className="toggle" role="radiogroup" aria-label="how to give your estimate">
          <span className="muted">your estimate</span>
          <button role="radio" aria-checked={!split} className={`pill seg ${!split ? "active" : ""}`} onClick={() => setSplit(false)}>direct</button>
          <button role="radio" aria-checked={split} className={`pill seg ${split ? "active" : ""}`} onClick={() => setSplit(true)}>break it down</button>
        </div>
        {!split ? (
          <label className="slider2">
            <span>Your estimate of the chance of this incident within 30 days <Tag k="hyp" /></span>
            <input type="range" min={0} max={0.3} step={0.0025} value={p ?? Math.min(0.3, c?.breakEven ?? 0)} onChange={(e) => setP(Number(e.target.value))} aria-label="your estimate" />
            <span className="sliderval">{p === null ? "—" : pct(p, 2)}</span>
          </label>
        ) : <>
          <label className="slider2">
            <span>1. Chance of the shock ({refine?.history ? `stETH at least ${(refine.history.incidentShockSize * 100).toFixed(0)}\u00a0% below ETH` : "the incident's price move"}) within 30 days <Tag k="hyp" /></span>
            <input type="range" min={0} max={0.5} step={0.0025} value={a ?? 0} onChange={(e) => setPa(Number(e.target.value))} aria-label="chance of the shock" />
            <span className="sliderval">{pa === null && ref
              ? <>{ref.k} of {ref.n} windows{ref.k > 3 ? ` ≈ ${pct(ref.k / ref.n, 1)}` : ""} <span className="small muted">(historical reference; move it if you disagree)</span></>
              : a === null ? "—" : pct(a, 2)}</span>
          </label>
          <label className="slider2">
            <span>2. Chance that others exit before you, if the shock happens <Tag k="hyp" /></span>
            <input type="range" min={0} max={1} step={0.01} value={pb ?? 0.5} onChange={(e) => setPb(Number(e.target.value))} aria-label="chance that others exit first" />
            <span className="sliderval">{pb === null ? "—" : pct(pb, 0)}</span>
          </label>
          <p className="small">Your estimate = 1 × 2 = <b>{pEff === null ? "—" : pct(pEff, 2)}</b>, compared with the threshold above.</p>
        </>}
        <p className={`reading ${pEff === null ? "muted" : reading.includes("leaving pays") ? "bad" : "good"}`} aria-live="polite">{reading}</p>
        {vl && <p className="small vaultlevel">{vl.ratio >= 0.01
          ? <>Credora defines a significant loss as bad debt above 1&nbsp;% of principal. This incident produces <b>{pct(vl.ratio, 2)}</b> at vault level <Tag k="modeled" /> ({vl.basis.startsWith("analytic economic shortfall") ? "an economic shortfall that the oracle does not recognise on-chain" : "modeled loss"}).</>
          : <>At vault level this incident produces <b>{pct(vl.ratio, 2)}</b> of the vault's assets <Tag k="modeled" />, below the 1&nbsp;% of principal that Credora uses to define a loss event.</>}</p>}
        <button className="pill primary" aria-expanded={calc} onClick={() => setCalc(!calc)}>{calc ? "Hide the calculation" : "Show how this is calculated"}</button>
        {calc && c && (
          <div className="detailbox">
            <table><tbody>
              <tr><td>Loss in the incident, modeled <Tag k="modeled" /></td><td className="r">{n(c.valueLoss)} {u}</td></tr>
              <tr><td>Locked after others run, {n(c.lockedAfterRun)} {u} <Tag k="fork" />, valued at {hc * 100} % <Tag k="hyp" /></td><td className="r">{n(c.lockedPart)} {u}</td></tr>
              <tr><td><b>Total loss if the incident happens</b></td><td className="r"><b>{n(c.incidentLoss)} {u}</b></td></tr>
              <tr><td>Cost of leaving: yield given up over 30 days ({pct(r.verdictParams.netApy, 2)} a year) + gas</td><td className="r">{n(c.exitCost)} {u}</td></tr>
              <tr><td>Share of the position that can leave now <Tag k="fork" /></td><td className="r">{pct(c.exitableShare)}</td></tr>
              <tr><td><b>Chance above which leaving pays off</b> = cost of leaving ÷ (loss × share that can leave)</td><td className="r"><b>{fmtP(c.breakEven)}</b></td></tr>
            </tbody></table>
            {c10 && c10.lockedPart > 0 && <p className="small">At 10 %, {n(c10.lockedPart)} of the {n(c10.incidentLoss)} {u} come from the cost of being locked in; at 0 %, the loss is {n(c0?.incidentLoss ?? 0)} {u}. Other incidents and horizons: see “Decision in detail” below.</p>}
          </div>
        )}
      </>}
    </section>
  );
}

/** One line on the configuration timelock (governance), kept apart from the liquidity lock. */
function governanceLine(gv: any) {
  const d = gv.timelockDays;
  const t = d === null ? "timelock not read" : d === 0 ? "no timelock: configuration changes apply immediately" : `configuration changes wait ${Number(d.toFixed(2))} days (timelock)`;
  return `Governance: ${t}${gv.guardian ? ", and a guardian can veto them" : ", no guardian"} (read on-chain). This is about the vault's settings, not about liquidity.`;
}

export function NotModeledCard({ r, refine }: { r: any; refine?: any }) {
  const nm = r.notModeled;
  if (!nm) return null;
  return (
    <details className="card glass fold sr">
      <summary><span className="serif">Not modeled</span> <span className="muted">contract hack, governance attack, oracle exploit</span></summary>
      <p>These risks cannot be read on-chain, so they are not simulated.</p>
      <h3 className="nmh">Contract hack: total-loss threshold</h3>
      <p>A hack comes without warning. If it wiped out the whole position ({w(r.target.holderValue)} {r.target.assetSymbol}), leaving now pays off above these chances:</p>
      <div className="threestats">
        {nm.totalLoss.map((x: any) => (
          <div key={x.horizonDays} className="stat"><span className="statlabel">within {x.horizonDays} days</span><span className="statnum">{x.decision === "NO_ACTION_POSSIBLE" ? "—" : fmtP(x.breakEven)}</span></div>
        ))}
      </div>
      <p className="small">Same calculation and inputs as above (yield given up {pct(r.verdictParams.netApy, 2)} a year, gas and slippage executed on the fork). Other risk teams also avoid predicting hack probabilities; we show the threshold instead. <b>The probability is yours, nothing here predicts it.</b></p>
      <h3 className="nmh">Governance attack</h3>
      {refine?.governance ? (
        refine.governance.timelockDays > 0
          ? <p>Changes to the vault's configuration wait {Number(refine.governance.timelockDays.toFixed(2))} days (timelock){refine.governance.guardian ? " and a guardian can veto them" : ""}, read on-chain. The threshold above applies to a governance attack only if you do not watch the vault's pending changes; if you do, you can leave during those {Number(refine.governance.timelockDays.toFixed(2))} days. This timelock concerns the vault's settings; it is not the liquidity lock measured above.</p>
          : <p>This vault has no timelock: configuration changes apply at once, so the threshold above applies to a governance attack as it is.</p>
      ) : <p>Timelock and guardian: {NM}.</p>}
      <h3 className="nmh">Oracle exploit beyond the modeled moves</h3>
      <p>Treated like a hack: the total-loss threshold above applies.</p>
    </details>
  );
}
