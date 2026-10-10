/**
 * Newcomer view: one question, a one-word answer, then three steps (what you put in, what could go wrong,
 * stay or leave). Display only: every number comes from the exported report and derived files; the only
 * arithmetic is scaling a measured amount to "per 1,000" and turning a threshold into "1 in N".
 */
import { useEffect, useMemo, useState } from "react";
import { pct, w } from "./lib";
import { pickScenarios } from "./Opening";

/** Plain-language glossary. Each technical word is explained at its first appearance with a "?" and listed on #/glossary. */
export const GLOSSARY: Record<string, { term: string; plain: string; more?: string }> = {
  vault: { term: "vault", plain: "a pool where your money is lent out", more: "Here, a MetaMorpho vault: a manager (curator) chooses which lending markets on Morpho receive the pool's money." },
  weth: { term: "WETH", plain: "Ethereum, in token form", more: "Wrapped ether: 1 WETH can always be exchanged for 1 ETH." },
  liquidity: { term: "cash available to withdraw (liquidity)", plain: "the part of the pool's money that is not lent out and can be withdrawn right now" },
  oracle: { term: "price source (oracle)", plain: "the price source the pool trusts", more: "A contract that tells the lending market what a deposit is worth. Some only follow an exchange rate and do not see a market price drop." },
  breakeven: { term: "break-even probability", plain: "how likely a problem must be for leaving to be worth it", more: "Shown as p* in expert mode: cost of leaving ÷ (loss if the problem happens × share that can leave)." },
  steth: { term: "stETH (staked ether)", plain: "ether deposited in Lido's staking, as a token; it normally trades at about 1 ETH" },
  wsteth: { term: "wstETH", plain: "stETH wrapped in another token so it can be used as a deposit by borrowers" },
  morpho: { term: "Morpho", plain: "the lending protocol where the pool's money is lent out" },
  market: { term: "lending market", plain: "a place where lenders' money is borrowed against a deposit (collateral)" },
  collateral: { term: "collateral", plain: "what a borrower leaves as a deposit; it can be sold if its value falls too far" },
  liquidation: { term: "liquidation", plain: "selling a borrower's deposit when it no longer covers the loan" },
  depeg: { term: "depeg", plain: "when a token that should trade at about the price of another one falls below it" },
  queue: { term: "withdraw queue", plain: "the order in which the pool takes cash from its lending markets when someone withdraws" },
  curator: { term: "curator / allocator", plain: "the managers who decide where the pool lends and how much" },
  timelock: { term: "timelock", plain: "a waiting period before a change to the pool's rules takes effect" },
  guardian: { term: "guardian", plain: "an account that can cancel a pending change to the pool's rules" },
  fork: { term: "fork (copy of Ethereum)", plain: "a private copy of Ethereum frozen at one moment, on which withdrawals are really executed without touching the real network" },
  block: { term: "block", plain: "one page of Ethereum's history; block 26,157,638 is the moment the copy was frozen (9 Oct 2026)" },
  replay: { term: "replay", plain: "executing every recorded withdrawal again on a fresh copy and checking the result is identical" },
  wei: { term: "wei", plain: "the smallest unit of ether: one billionth of a billionth of 1 ETH" },
  hhi: { term: "HHI (concentration index)", plain: "a number from 0 to 1 that says how concentrated the pool's lending is (1 = all in one place)" },
  utilization: { term: "utilization", plain: "the share of a lending market's money that is borrowed" },
  baddebt: { term: "bad debt", plain: "a loan that can no longer be repaid in full, recorded as a loss" },
  shortfall: { term: "economic shortfall", plain: "a loss that exists in market prices but that the pool's price source has not recorded" },
  pstar: { term: "p*", plain: "the break-even probability, in expert mode" },
  bps: { term: "basis points", plain: "hundredths of a percent: 100 basis points = 1 %" },
  l: { term: "ℓ (loss)", plain: "a symbol sometimes used for the loss if the problem happens" },
  W: { term: "W (withdrawable)", plain: "a symbol sometimes used for what can be withdrawn" },
};

/** A word followed by a "?" that opens its plain explanation (44 px target, works on tap and keyboard). */
export function Term({ k, children }: { k: keyof typeof GLOSSARY; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const g = GLOSSARY[k];
  return (
    <span className="term">
      {children}
      <button type="button" className="qbtn" aria-expanded={open} aria-label={`What does "${g.term}" mean?`} onClick={() => setOpen(!open)}><span aria-hidden="true">?</span></button>
      {open && <span className="tip qtip" role="tooltip">{g.plain}. <a href="#/glossary">Glossary</a></span>}
    </span>
  );
}

/** The four kinds of number, written in full. */
const WORDS = {
  fork: ["Measured", "Really executed on a copy of Ethereum frozen on 9 Oct 2026."],
  modeled: ["Modeled", "Computed from measured data with stated assumptions."],
  hyp: ["Your assumption", "A choice you make; nothing here predicts it."],
  hist: ["Historical", "Past prices, not a forecast."],
} as const;
export function Kind({ k }: { k: keyof typeof WORDS }) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`tag tag-${k} kind`}>
      <button type="button" className="tagbtn" aria-expanded={open} onClick={() => setOpen(!open)} title={WORDS[k][1]}><span className="tagpill">{WORDS[k][0]}</span></button>
      {open && <span className="tip" role="tooltip">{WORDS[k][1]}</span>}
    </span>
  );
}

const oneIn = (p: number | null | undefined) => (p === null || p === undefined ? "—" : p > 1 ? "never" : `1 in ${Math.max(1, Math.round(1 / p))}`);
const per1000 = (x: string | bigint, total: string | bigint) => { const t = BigInt(total); return t === 0n ? 0 : Number((BigInt(x) * 100000n) / t) / 100; };
const n0 = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 0 });
const n2 = (x: number) => x.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** The hero's one-sentence answer (no technical word). */
export function answerSentence(a: any) {
  if (!a) return null;
  const worst = Math.round(a.worstShare * 100);
  const who = a.worstRun.otherPool ? "the biggest depositors (here and in another pool that lends to the same borrowers)" : "the biggest depositors";
  if (!a.aloneFull) return `Not all of it right now: even if nobody leaves before you, only about ${Math.round(a.aloneShare * 100)} % of a deposit this size can come out; the rest waits until borrowers repay.`;
  if (a.worstShare >= 0.999) return "Yes: even if the biggest depositors leave before you, all of it can come out.";
  return `Today, yes, all of it. But if ${who} leave first, only about ${worst} % of a large deposit could come out at once; the rest would have to wait.`;
}

/** Who leaves first, in plain words (from the executed run's labels). */
function whoFirst(r: any, run: any) {
  return run.others.map((o: any) => {
    if (o.vault.toLowerCase() !== r.target.vault.toLowerCase()) {
      const own = /^(.*?) #1 exits its own vault/.exec(o.label)?.[1];
      if (own) return `the biggest depositor of ${own} (another pool lending to the same borrowers)`;
      const pool = /exits (.*)$/.exec(o.label)?.[1] ?? "another pool";
      return `the same depositor's money in ${pool}`;
    }
    const k = /^holder #(\d+)/.exec(o.label)?.[1];
    return k ? `depositor #${k} of this pool` : "another big depositor";
  }).join(" and ");
}

export function Steps({ r, refine, g, history, children, controls, open, setOpen }: {
  r: any; refine?: any; g?: any; history?: any; children?: React.ReactNode; controls: React.ReactNode; open: number; setOpen: (n: number) => void;
}) {
  const scenarios = useMemo(() => pickScenarios(r), [r]);
  const [sel, setSel] = useState(0);
  const [more, setMore] = useState(false);
  const [p, setP] = useState<number | null>(null);
  useEffect(() => { setSel(0); setMore(false); setP(null); }, [r]);
  const u = r.target.assetSymbol;
  const value = r.target.holderValue;
  const sc = scenarios[Math.min(sel, scenarios.length - 1)];
  const run = sc.run;
  const back = per1000(run.holderExecutedExit, value);
  const full = run.fullExitOk;
  const grid: any[] = r.verdictGrid ?? [];
  const inc = grid.find((x) => x.id === r.bindingIncident);
  const c10 = inc?.cells.find((c: any) => c.horizonDays === 30 && c.lockedHaircut === 0.1);
  const c0 = inc?.cells.find((c: any) => c.horizonDays === 30 && c.lockedHaircut === 0);
  const pos = Number(BigInt(value)) / 10 ** r.target.assetDecimals;
  const title = r.incidents?.find((i: any) => i.id === r.bindingIncident)?.title as string | undefined;
  const blind = title && /^Incident: stETH depegs/.test(title);
  const nm30 = r.notModeled?.totalLoss?.find((x: any) => x.horizonDays === 30);
  const gv = refine?.governance;
  const h = refine?.history && history ? history : null;
  const hRow = h?.windows.bySize.find((x: any) => Math.abs(x.size - refine.history.incidentShockSize) < 1e-9);
  const reading = p === null || !c10 || !c0 ? null
    : c10.decision === "NO_ACTION_POSSIBLE" ? "You could not leave now anyway."
    : (c10.breakEven === null || p <= c10.breakEven) && (c0.breakEven === null || p <= c0.breakEven) ? "With your estimate, staying is cheaper either way."
    : (c10.breakEven !== null && p > c10.breakEven) && (c0.breakEven !== null && p > c0.breakEven) ? "With your estimate, leaving is worth it either way."
    : "With your estimate, it depends on how much money stuck for a while would cost you (see the two boxes above).";
  const peer = sc.key === "other" ? g?.peers?.find((x: any) => x.vault.toLowerCase() === run.others[0]?.vault?.toLowerCase()) : null;
  const titles = ["What you put in", "What could go wrong", "Stay or leave"];
  return (
    <section className="steps" aria-label="three steps">
      <ol className="stepper">
        {titles.map((t, i) => <li key={t}><button className={`stepbtn ${open === i + 1 ? "on" : ""}`} aria-current={open === i + 1 ? "step" : undefined} onClick={() => setOpen(i + 1)}><span className="stepn">{i + 1}</span> {t}</button></li>)}
      </ol>

      {open === 1 && <div className="nbox" id="step-1">
        <h2>1. What you put in</h2>
        {controls}
        <p>Your money goes into <b>{r.target.name}</b>, a <Term k="vault">vault</Term> that lends it to borrowers, who leave other crypto as a deposit.</p>
        <p>The example used on this page is its biggest depositor, with <b>{w(value)} {u === "WETH" ? <Term k="weth">WETH</Term> : u}</b> in it <Kind k="fork" />.</p>
        <p>Right now about <b>{Math.round(r.vault.liquidRatio * 100)} %</b> of the pool's money is <Term k="liquidity">cash available to withdraw</Term>; the rest is lent out <Kind k="fork" />.</p>
        <div className="stepnav"><span /><button className="pill primary" onClick={() => setOpen(2)}>Next</button></div>
      </div>}

      {open === 2 && <div className="nbox" id="step-2">
        <h2>2. What could go wrong</h2>
        <p>Money can only come out as fast as there is cash in the pool. If other big depositors withdraw before you, they take the cash first.</p>
        <div className="npills" role="tablist" aria-label="who leaves before you">
          {scenarios.map((x, i) => <button key={x.key} role="tab" aria-selected={i === sel} className={`pill seg ${i === sel ? "active" : ""}`} onClick={() => { setSel(i); setMore(false); }}>{x.label}</button>)}
        </div>
        <div className={`example ${full ? "good" : "bad"}`} aria-live="polite">
          <p className="exline">Out of every 1,000 {u} in this position, about <b className="exnum">{n0(back)} {u}</b> could come out right away in this scenario.</p>
          <div className="thinbar"><div className={`fill ${full ? "good" : "bad"}`} style={{ width: `${Math.min(100, back / 10)}%` }} /></div>
          <p className="small">Scaled from the measured case: {w(run.holderExecutedExit)} of {w(value)} {u} <Kind k="fork" /></p>
        </div>
        <p className="plain2">{sc.key === "alone" ? (full ? "Nobody leaves before you: all of it can come out." : "Even if nobody leaves before you, not everything can come out at once.")
          : `If ${whoFirst(r, run)} ${run.others.length > 1 ? "leave" : "leaves"} first, ${full ? "you can still take everything out." : "the pool does not have enough cash for all of it right away; the rest waits until borrowers repay."}`}</p>
        {!full && <p className="small">A smaller deposit on its own can come out in full while cash lasts: about {w(run.holderExecutedExit)} {u} could leave in this case.</p>}
        {sc.key === "other" && <div className="othershort">
          <p>Another pool lends to the same borrowers. When its biggest depositor leaves, your cash runs out too.</p>
          <button className="pill ghostpill" aria-expanded={more} onClick={() => setMore(!more)}>{more ? "Show less" : "Show more"}</button>
          {more && peer && <p className="small">{peer.name} has one depositor with {w(peer.topHolder.assets)} {u}; both pools lend into the same market, where borrowers deposit staked ether. In the measured case, that depositor leaving first cut what could come out from {w(scenarios[0].run.holderExecutedExit)} to {w(run.holderExecutedExit)} {u} ({run.changePct.toFixed(2)} %) <Kind k="fork" />.</p>}
        </div>}
        {title && <div className="problem">
          <h3>The problem we test</h3>
          <p>{blind ? <>The price of <Term k="steth">staked ether (stETH)</Term> drops on the market, but the <Term k="oracle">price source</Term> the pool trusts does not see it, and big depositors leave first.</>
            : <>One of the prices the pool relies on falls by 10 %, borrowers' deposits are sold, and big depositors leave first.</>} <Kind k="hyp" /></p>
        </div>}
        <div className="stepnav"><button className="pill ghostpill" onClick={() => setOpen(1)}>Back</button><button className="pill primary" onClick={() => setOpen(3)}>Next</button></div>
      </div>}

      {open === 3 && <div className="nbox" id="step-3">
        <h2>3. Stay or leave</h2>
        {!inc || !c10 || !c0 ? <p className="verdictN">No problem scenario could be built for this pool, so there is no threshold here: only what can come out (step 2) is measured.</p>
          : c10.decision === "NO_ACTION_POSSIBLE" ? <p className="verdictN">You could not leave now anyway: less than 1 % can come out.</p>
          : <>
            <p className="verdictN">Stay, unless you think this problem is more likely than about <b>{oneIn(c10.breakEven)}</b> over the next month.</p>
            <p className="verdictWhy">Why: leaving costs about {n2(c10.exitCost / pos * 1000)} {u} per 1,000 in interest you give up; if the problem happens, it would cost about {n0(c10.incidentLoss / pos * 1000)} {u} per 1,000 <Kind k="modeled" />, counting money stuck for a while at 10 % of its value <Kind k="hyp" />.</p>
            <div className="twostats">
              <div className="stat"><span className="statlabel">If money stuck for a while costs you 10 %</span><span className="statnum">{oneIn(c10.breakEven)}</span><span className="statsub">leaving is worth it above <Term k="breakeven">this chance</Term> ({pct(c10.breakEven, 2)})</span></div>
              <div className="stat"><span className="statlabel">If it costs you nothing</span><span className="statnum">{oneIn(c0.breakEven)}</span><span className="statsub">leaving is worth it above this chance ({pct(c0.breakEven, 2)})</span></div>
            </div>
            <label className="slider2">
              <span>What do you think? The chance of this problem in the next month <Kind k="hyp" /></span>
              <input type="range" min={0} max={0.3} step={0.0025} value={p ?? Math.min(0.3, c10.breakEven ?? 0)} onChange={(e) => setP(Number(e.target.value))} aria-label="your estimate of the chance" />
              <span className="sliderval">{p === null ? "—" : `${pct(p, 2)} (${oneIn(p)})`}</span>
            </label>
            <p className={`reading ${reading === null ? "muted" : /leaving is worth it either/.test(reading) ? "bad" : /staying/.test(reading) ? "good" : ""}`} aria-live="polite">{reading ?? "Move the slider to compare your own estimate."}</p>
          </>}
        {h && hRow && <p className="before">Has it happened before? From {h.period.from.slice(0, 4)} to {h.period.to.slice(0, 4)}, stETH fell {Math.round(refine.history.incidentShockSize * 100)} % or more below ETH within a month in {hRow.k} of {hRow.n} months; its largest fall within a month was {(h.windows.worst.drop * 100).toFixed(2)} % ({new Date(h.windows.worst.troughAt ?? h.windows.worst.start).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}).
          {hRow.k === 0 ? <> That does not mean zero risk: with this sample it could still happen in up to about 1 month in {Math.round(hRow.n / 3)}.</> : null} A reference, not a forecast <Kind k="hist" />.</p>}
        <div className="cannot">
          <h3>What this tool cannot see</h3>
          <p>A hack, a technical failure, or a human decision. {gv ? (gv.timelockDays > 0 ? <>The managers can change the pool's rules, but changes wait {Number(gv.timelockDays.toFixed(2))} days{gv.guardian ? " and can be cancelled" : ""}, so if you watch, you can leave first. </> : <>The managers' changes apply immediately in this pool. </>) : null}
            {nm30 && nm30.decision !== "NO_ACTION_POSSIBLE" ? <>If one of these wiped out everything, leaving now would be worth it above about {oneIn(nm30.breakEven)} over a month ({pct(nm30.breakEven, 2)}). </> : null}That chance is yours to judge; nothing here predicts it.</p>
        </div>
        <p className="legendN"><Kind k="fork" /> executed on a copy of Ethereum · <Kind k="modeled" /> computed with stated assumptions · <Kind k="hyp" /> your choice · <Kind k="hist" /> past prices, not a forecast</p>
        <div className="stepnav"><button className="pill ghostpill" onClick={() => setOpen(2)}>Back</button><span /></div>
      </div>}
      {children}
    </section>
  );
}

export function GlossaryPage() {
  return (
    <main className="page glossary">
      <p><a href="#">← Back</a></p>
      <h1>Glossary</h1>
      <p>Every technical word used on this site, in plain language.</p>
      <dl>
        {Object.entries(GLOSSARY).map(([k, g]) => <div key={k} id={`g-${k}`} className="gitem"><dt>{g.term}</dt><dd>{g.plain}.{g.more ? <> {g.more}</> : null}</dd></div>)}
      </dl>
    </main>
  );
}
