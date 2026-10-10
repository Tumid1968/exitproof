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
