/**
 * Plain-language helpers: glossary, the "?" next to a technical word, the four kinds of number in full words,
 * and the glossary page. Used by the "Why?" blocks (Lean.tsx).
 */
import { useState } from "react";

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
