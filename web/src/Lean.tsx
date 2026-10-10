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
  const [p, setP] = useState<number | null>(null); // no verdict on the user's guess before the slider is touched
  const [out, setOut] = useState<string | null>(null);
  useEffect(() => { setP(null); setOut(null); }, [r]);
  const run = worstRun(r, refine);
  const value = BigInt(r.target.holderValue);
  const share = value === 0n ? 0 : Number((BigInt(run.holderExecutedExit) * 10000n) / value) / 100;
  const u = r.target.assetSymbol;
  const c = cellOf(r, 0.1);
  const be = c?.breakEven ?? null;
  const a = refine?.answer;
  const replay = async () => {
    if (mode !== "live") {
      setOut(entry?.replay ? `Recorded replay: ${entry.replay.okScenarios}/${entry.replay.scenarios} runs identical to the wei.` : "No recorded replay for this pool.");
      return;
    }
    setOut("Running on the fork…");
    try {
      const o: any = await apiPost("/api/run", { vault: r.target.vault, holder: r.target.holder, exits: run.others.map((x: any) => ({ vault: x.vault, owner: x.owner, label: x.label })) });
      const ex = o.result.results.filter((x: any) => x.type === "exit" && x.result.owner === r.target.holder);
      const got = ex[0].result.ok ? ex[0].result.assetsOutWei : ex[1]?.result.assetsOutWei ?? "0";
      setOut(`${w(got, 6)} ${u} in ${o.ms} ms: ${got === run.holderExecutedExit ? "identical to the wei" : "DIFFERENT from the record"}.`);
    } catch (e) { setOut(String((e as Error).message)); }
  };
  const decided = p !== null && be !== null && c?.decision !== "NO_ACTION_POSSIBLE";
  return (
    <section className="lean" id="top">
      <div className="leanbody">
        <div className="vsel">{select}</div>
        {a ? <p className={`bigword w-${a.level}`}>{a.word}</p> : <p className="bigword">…</p>}
        <p className="wordsub">For the largest deposit in this pool</p>
        <p className="figure">If others leave first, you get back <b>{w(run.holderExecutedExit)}</b> of {w(value)} {u}</p>
        <div className="leanbar" role="img" aria-label={`${share.toFixed(0)} % gets out`}><div className={`fill ${run.fullExitOk ? "good" : "bad"}`} style={{ width: `${Math.min(100, share)}%` }} /></div>
        {!c || be === null ? <p className="verdictL">No problem scenario for this pool: no advice.</p>
          : c.decision === "NO_ACTION_POSSIBLE" ? <p className="verdictL"><b>Stay</b>: you could not get out now anyway.</p>
          : decided ? <p className="verdictL"><b className={p! > be ? "leave" : "stay"}>{p! > be ? "Leave" : "Stay"}</b>: your guess {oneIn(p)} is {p! > be ? "above" : "below"} {oneIn(be)} this month.</p>
          : <p className="verdictL"><b>Leave</b> if you think a problem is more likely than {oneIn(be)} this month.</p>}
        {c && be !== null && c.decision !== "NO_ACTION_POSSIBLE" && <label className="guess">
          <span>Your guess: {p === null ? "—" : oneIn(p)}</span>
          <input type="range" min={0.0025} max={0.2} step={0.0025} value={p ?? Math.min(0.2, Math.max(0.0025, be))} onChange={(e) => setP(Number(e.target.value))} aria-label="your guess" />
        </label>}
        <div className="actions">
          <button className="pill primary" onClick={replay} disabled={out === "Running on the fork…"}>{mode === "live" ? "Run the exit" : "Replay"}</button>
          <button className="pill ghostpill" aria-expanded={why} onClick={() => { setWhy(!why); if (!why) setTimeout(() => document.getElementById("why")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }), 0); }}>Why?</button>
        </div>
        {out && <p className="runout" aria-live="polite">{out}</p>}
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
