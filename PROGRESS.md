# PROGRESS

## Fait (sam. 10 oct.)
- Moteur, découverte, chocs, verdict, replay, interface : voir NOTES 1-31 et l'historique git.
- **Série 3 d'Alex (sam. ~16:20)** :
  1. Version statique `docs/` (double-clic, GitHub Pages, Vercel ; aucun fork, RPC ni réseau) ; 23 coffres ; bandeau honnête ; bouton d'exécution grisé avec empreinte du manifeste et statut du replay ; aucune clé dans les JSON (grep).
  2. Écran : verdict en fourchette (1,13 % / 5,57 %), ligne mesuré / modélisé / hypothèse avec 463/580 WETH, « What I really get back » (6 ordres exécutés, erreur + sélecteur, coussin), décision (horizon, interrupteur 10 % / 0 %, trois tuiles), onglets (Dependencies 7 couches, Exits, Shocks, Withdraw queue, Evidence, Replay), prénom « Jad », thème clair/sombre, mobile (600 px vérifiés).
  3. `npm run demo` supervisé, page `#/status`, repli automatique en statique ; clone propre hors connexion : test:fork 9/9, replay OK.
  4. Honnêteté visible dans l'interface.
  5. Réponses : valeur 5209914854809315636083 expliquée (NOTES 32) ; replay hors connexion sur clone propre vert.
  6. DEMO.md (90 s commençant par l'ordre des sorties, 3 min), LIVRABLES.md.

- **Retour du jury** (sam. ~17:00) : curseur sans verdict par défaut, « Not modeled » avec point mort perte totale, 10 % et 0 % à égalité, verdict en deux lignes, arrondis corrigés, README/DEMO recentrés (NOTES 38-39).

## Reste à faire (Alex)
- git push, activer GitHub Pages sur `/docs` et recopier l'URL dans LIVRABLES.md, enregistrer la vidéo de secours, soumettre.

## Redesign v2 (10 Oct, display only; tag pre-redesign-v2)
- Done: full-screen hero over hand-written canvas waves (≤30 fps cap, DPR ≤1.5, 0.6× resolution under 700 px, paused when the tab is hidden, a still frame with reduced motion); facts row read from index/manifests (block, replay verdict, coverage); fixed nav, opaque after the hero; blurred cards; "See it in action" opens the "Another vault" scenario; Outfit font embedded (SIL OFL); light theme for the content under the hero.
- Wording: "stETH depegs (oracle blind)"; 6 reports rebuilt from existing runs, amounts identical, 6 replays OK.
- Checked: 14/14 unit, 9/9 fork; static site has no external requests at 375 and 1440 px; no horizontal scroll; live mode OK; +80.6 KB (code + font) vs. acb2b92.
- Screens: results/screens/v2-*.png. Measured waves frame rate (headless Chrome, software rendering): 30 fps at 375 px, 19–24 fps at 1440 px.

## End-to-end test (10 Oct, tag pre-e2e)
- `npm run test:e2e`: 42 checks, 41 passed, 0 failed, 1 skipped (opt-in real fork kill), about 72 s. Static site over HTTP and file:// at 1440/375 px, 23 vaults, live mode with `npm run demo` running. B4 (real kill, `E2E_KILL_FORK=1`) passed in separate runs.
- First display of the default vault: 311–405 ms (headless Chrome, local).
- Bugs found and fixed (separate commits fc60045, 128efac): nested buttons in the 10 %/0 % tiles; static build probing /api/status (404 on HTTP and Pages); favicon 404; light-theme hero contrast without the canvas; mobile text under 16 px and controls under 44 px; mobile top bar wrapping; "Internal error: fetch failed" during a fork restart.
- Open: 14 controls inside the expert tabs are under 44 px on mobile (warning, not failed). After the fork fallback, the page stays in static mode until reload. A real fork kill shows the banner only if the outage lasts past the page's 8 s poll (the supervisor restarts the fork in ~7 s).

## Probability references (10 Oct, tag pre-proba)
- Done 1-5: stETH/ETH history (k of N, percentiles), break-it-down mode, total-loss threshold + governance window + exit window, vault-level loss vs Credora's 1 %, HHI and utilization vs 90 %, pegged/volatile regimes. No existing number changed; results/history and results/refine are new files.
- Tests: 16/16 unit, 54 e2e (53 passed, 1 opt-in skipped), 9/9 fork.
- Fixed on the way (separate commit): transparent sticky tab bar.
- Open: Credora definition not re-checked (forum unreachable); history covers only the stETH depeg incident (Steakhouse ETH, Gauntlet WETH Prime).

## Polish (10 Oct, tag pre-polish)
- Incident defined in plain words; 'Another vault' explains the shared market (one wstETH market, from the graph); tags with letters F/M/A/H, legend = honesty line; hero 'for this vault' + 'all 23 vaults replayed OK' (from the index).
- Oct 10, 2025 from every feed round: 0.999667 → 0.955694, −4.40 % (9.5× the 1-day p99), fall 7 min 48 s, back within 0.5 % after 38 min 48 s; the daily sample shows 0.45 % (counts understate intraday drops).
- Rule of three, Credora wording (economic shortfall, approximate), threshold tooltip, DefiLlama citation (page 403 to automated requests, not re-read).
- Bug fixed (separate commit): live 'Execute again' failed with 'evm_revert failed' after another process used the fork.
- Tests: 16/16 unit, 9/9 fork, e2e 70 (69 passed, 1 opt-in skipped).

## Intraday history and newcomer view (10 Oct, tags pre-intraday, pre-novice)
- History on every round: k = 13, 3, 0, 0, 0, 0 of 62 (daily sample 6, 1, 0, 0, 0, 0); worst window −4.75 % (Jun 2022); 1-day p95/p99 0.15 %/0.60 %, 30-day 2.83 %/4.54 %.
- Newcomer view: one question + Easy/Tight/Hard exit (about leaving, not advice), three steps, "?" on terms, glossary page, scaled example, verdict in two lines, expert mode closed by default.
- Tests: unit 17/17, e2e 90 (89 passed, 1 opt-in skipped), fork 9/9.

## Lean main screen (10 Oct, tag pre-lean)
- One screen (fits 375×667): pool, exit word, worst case X of Y, verdict line + slider, Replay / Run the exit, Why?. Main screen 41 words (95 before); Why? blocks 38/37/31/32.
- Removed: three-step view, hero question and long sentence, per-1,000 example, How to read / Glossary / Demo in the top bar (glossary still reached from the "?" in Why?).
- Tests: unit 17/17, e2e 101 (100 passed, 1 opt-in skipped), fork 9/9.
