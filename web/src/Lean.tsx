/**
 * Main screen: pick a pool, see how hard the exit is and what to do. Display only: every number comes from the
 * exported report and derived files; the only arithmetic is "1 in N" and per-1,000 scaling.
 * "Why?" opens four short blocks below; expert mode (all panels) stays closed by default.
 */
import { useEffect, useMemo, useState } from "react";
import { apiPost, type IndexEntry, type Mode } from "./data";
import { w } from "./lib";
import { Kind, Term } from "./Novice";
import { pickScenarios } from "./Opening";
import { amountError, parseAmount, sizeCase, type LiveMeasure } from "../../src/verdict/size";

const oneIn = (p: number | null | undefined) => (p === null || p === undefined ? "—" : p > 1 ? "never" : `1 in ${Math.max(1, Math.round(1 / p))}`);
const n0 = (x: number) => x.toLocaleString("en-US", { maximumFractionDigits: 0 });

/** worst executed run for the largest deposit (the one the exit word is based on) */
function worstRun(r: any, refine?: any) {
  return r.runs.find((x: any) => x.id === refine?.answer?.worstRun?.id) ?? [...r.runs].sort((a: any, b: any) => (BigInt(a.holderExecutedExit) < BigInt(b.holderExecutedExit) ? -1 : 1))[0];
}
const cellOf = (r: any, hc: number) => r.verdictGrid?.find((x: any) => x.id === r.bindingIncident)?.cells.find((c: any) => c.horizonDays === 30 && c.lockedHaircut === hc);

export function MainScreen({ r, refine, entry, mode, select, fallback, why, setWhy }: {
  r: any; refine?: any; entry?: IndexEntry; mode: Mode; select: React.ReactNode; fallback: string | null; why: boolean; setWhy: (b: boolean) => void;
}) {
  const dec = r.target.assetDecimals;
  const u = r.target.assetSymbol;
  const pos = BigInt(r.target.holderValue);
  const defaultText = w(pos);
  const [p, setP] = useState<number | null>(null); // no verdict on the user's guess before the slider is touched
  const [amountText, setAmountText] = useState(defaultText);
  const [priceText, setPriceText] = useState("");
  const [live, setLive] = useState<{ amount: bigint; m: LiveMeasure } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setP(null); setAmountText(w(BigInt(r.target.holderValue))); setLive(null); setNote(null); }, [r]);
  const worstId = worstRun(r, refine).id;
  // the default text stands for the exact largest position (so its numbers are the report's)
  const typed = amountText === defaultText ? pos : parseAmount(amountText, dec);
  const valid = typed !== null && typed > 0n;
  const amountMsg = amountText === defaultText ? null : amountError(amountText, dec);
  const [priceFocus, setPriceFocus] = useState(false);
  const liveNow = live && valid && live.amount === typed ? live.m : undefined;
  const sc = valid ? sizeCase(r, worstId, typed!, liveNow) : null;
  const price = priceText.trim() === "" ? null : Number(priceText.replace(",", "."));
  const eur = (x: bigint) => price !== null && Number.isFinite(price) && price > 0 ? (Number(x) / 10 ** dec * price).toLocaleString("en-US", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }) : null;
  const be = sc?.breakEven10 ?? null, be0 = sc?.breakEven0 ?? null;
  const run = async () => {
    if (mode !== "live") {
      setNote(entry?.replay ? `Recorded replay: ${entry.replay.okScenarios}/${entry.replay.scenarios} runs identical to the wei.` : "No recorded replay for this pool.");
      return;
    }
    if (!valid) return;
    setBusy(true); setNote("Simulating on the fork…");
    try {
      const o: any = await apiPost("/api/size", { vault: r.target.vault, amount: typed!.toString() });
      setLive({ amount: typed!, m: { exitNow: BigInt(o.exitNow), gasCostOut: BigInt(o.gasCostOut), gasCostReentry: BigInt(o.gasCostReentry) } });
      setNote(null);
    } catch (e) {
      const m = String((e as Error).message);
      setLive(null);
      setNote(/^(Pick a pool|Enter an amount|No result)/.test(m) ? m : "Fork not reachable: scaled from the measured case.");
    }
    setBusy(false);
  };
  const decided = p !== null && be !== null && !sc?.noAction;
  const guessMin = 0.0025, guessMax = 0.2;
  return (
    <section className="lean" id="top">
      <div className="leanbody">
        <div className="vsel">{select}</div>
        <div className="amount-row">
          <label className="amt"><span>How much did you put in?</span>
            <span className="amtfield"><input inputMode="decimal" value={amountText} onChange={(e) => { setAmountText(e.target.value); setNote(null); }} aria-label="how much did you put in" /><span className="unit">{u}</span></span>
          </label>
          <span className="pricefield">
            <input className="price" inputMode="decimal" value={priceText} onChange={(e) => setPriceText(e.target.value)} onFocus={() => setPriceFocus(true)} onBlur={() => setPriceFocus(false)} placeholder={`Price of 1 ${u} in €`} aria-label={`Price of 1 ${u} in €`} aria-describedby="pricehint" />
            {(priceFocus || priceText.trim() !== "") && <span className="pricehint" id="pricehint">Your own figure, not a market quote</span>}
          </span>
        </div>
        {!sc ? <p className="figure invalid" role="alert">{amountMsg ?? "Enter an amount above 0."}</p> : <>
          <p className={`bigword w-${sc.level}`}>{sc.word}</p>
          <p className="figure">If others leave first, <b>{w(sc.now)}</b> of your {w(sc.amount)} {u} comes out right away ({sc.changePct === 0 ? "±0.00" : sc.changePct.toFixed(2)} %).</p>
          {eur(sc.amount) && <p className="eur">{eur(sc.now)} of {eur(sc.amount)}{sc.wait > 0n ? `; ${eur(sc.wait)} would wait` : ""}</p>}
          <div className="leanbar" role="img" aria-label={`${Math.round(sc.worstShare * 100)} % comes out right away`}><div className={`fill ${sc.wait === 0n ? "good" : "bad"}`} style={{ width: `${Math.min(100, sc.worstShare * 100)}%` }} /></div>
          {sc.wait > 0n && <p className="wait">{w(sc.wait)} {u} would wait.</p>}
          <p className="source">{sc.capped ? `Above the measured range: shown for ${w(sc.amount)} ${u}.` : liveNow ? "Simulated on the fork, just now." : "Scaled from the measured case."}</p>
          {sc.capped && liveNow && <p className="source">Simulated on the fork, just now.</p>}
          {sc.noAction ? <p className="verdictL">Stay: you could not get out now anyway.</p>
            : be === null ? <p className="verdictL">No problem scenario for this pool: no advice.</p>
            : decided ? <p className="verdictL"><b className={p! > be ? "leave" : "stay"}>{p! > be ? "Leave" : "Stay"}</b>: your guess {oneIn(p)} is {p! > be ? "above" : "below"} {oneIn(be)} this month.</p>
            : <p className="verdictL">The break-even is {oneIn(be)} this month ({oneIn(be0)} if blocked money costs nothing).</p>}
          {be !== null && !sc.noAction && <label className="guess">
            <span>Your guess: {p === null ? "—" : oneIn(p)}</span>
            <input type="range" min={guessMin} max={guessMax} step={0.0025} value={p ?? (guessMin + guessMax) / 2} onChange={(e) => setP(Number(e.target.value))} aria-label="your guess" />
          </label>}
        </>}
        <div className="actions">
          <button className="pill primary" onClick={run} disabled={busy || (mode === "live" && !valid)}>{mode === "live" ? "Run the exit" : "Replay"}</button>
          <button className="pill ghostpill" aria-expanded={why} onClick={() => { setWhy(!why); if (!why) setTimeout(() => document.getElementById("why")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 0); }}>Why?</button>
        </div>
        {note && <p className="runout" aria-live="polite">{note}</p>}
        {fallback && <p className="modeline"><span className="fallback">{fallback}</span></p>}
      </div>
    </section>
  );
}

/** Four short blocks: incident, dependencies, locked-funds assumption, blind spots. */
export function Why({ r, refine, g, history }: { r: any; refine?: any; g?: any; history?: any }) {
  const scenarios = useMemo(() => pickScenarios(r), [r]);
  const u = r.target.assetSymbol;
  const pos = Number(BigInt(r.target.holderValue)) / 10 ** r.target.assetDecimals;
  const c10 = cellOf(r, 0.1), c0 = cellOf(r, 0);
  const title = r.incidents?.find((i: any) => i.id === r.bindingIncident)?.title as string | undefined;
  const blind = !!title && /^Incident: stETH depegs/.test(title);
  const hRow = refine?.history && history ? history.windows.bySize.find((x: any) => Math.abs(x.size - refine.history.incidentShockSize) < 1e-9) : null;
  const other = scenarios.find((x) => x.key === "other")?.run;
  const peer = other ? g?.peers?.find((x: any) => x.vault.toLowerCase() === other.others[0]?.vault?.toLowerCase()) : null;
  const nMarkets = refine?.concentration?.byMarket?.n;
  const nm30 = r.notModeled?.totalLoss?.find((x: any) => x.horizonDays === 30);
  const gv = refine?.governance;
  return (
    <section className="why" id="why" aria-label="why">
      <div className="whyblock">
        <h3>If a problem hits</h3>
        {title ? <p>{blind ? <>The price of <Term k="steth">staked ether</Term> drops. The pool's <Term k="oracle">price source</Term> does not see it.</> : <>One price the pool relies on falls 10 %. Borrowers' deposits are sold.</>}
          {c10 ? <> You lose about {n0(c10.incidentLoss / pos * 1000)} {u} per 1,000 <Kind k="modeled" />.</> : null}</p> : <p>No problem scenario could be built for this pool.</p>}
        {hRow && <p>A {Math.round(refine.history.incidentShockSize * 100)} % drop happened in {hRow.k} of {hRow.n} months since {history.period.from.slice(0, 4)} <Kind k="hist" />.</p>}
      </div>
      <div className="whyblock">
        <h3>Who depends on whom</h3>
        <p>Your <Term k="vault">pool</Term> lends{nMarkets ? <> through {nMarkets} market{nMarkets > 1 ? "s" : ""}</> : null}. Big depositors who leave first take the cash.</p>
        {peer && other && <p>{peer.name} lends into the same market. If its biggest depositor leaves, you get back {w(other.holderExecutedExit)} {u} <Kind k="fork" />.</p>}
      </div>
      <div className="whyblock">
        <h3>Money stuck for a while</h3>
        {c10 && c0 ? <p>Money that cannot get out at once counts at 10 % of its value <Kind k="hyp" />. If it costs you nothing, leave only above {oneIn(c0.breakEven)}.</p> : <p>Not measured for this pool.</p>}
      </div>
      <div className="whyblock">
        <h3>What this tool cannot see</h3>
        <p>A hack, a technical failure, or a human decision.</p>
        <p>{nm30 && nm30.decision !== "NO_ACTION_POSSIBLE" ? <>If one wiped you out, leaving pays above {oneIn(nm30.breakEven)} a month. </> : null}{gv && gv.timelockDays > 0 ? <>Rule changes wait {Number(gv.timelockDays.toFixed(2))} days.</> : null}</p>
      </div>
      <p className="legendline"><span className="dot fork" />Measured <span className="dot modeled" />Modeled <span className="dot hyp" />Your assumption <span className="dot hist" />Historical</p>
    </section>
  );
}
