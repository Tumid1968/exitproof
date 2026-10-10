# Livrables ExitProof

## 1. Version statique (le jury la voit sans nous)

- **Dans le dépôt** : `docs/index.html` — s'ouvre par double-clic, sans `npm install`, sans fork, sans clé RPC, sans réseau (vérifié depuis un clone propre le 10 oct. à 16:43).
- **Lien de déploiement** : *pas encore publié* (aucun push de ma part). Après le push d'Alex :
  - GitHub Pages : Settings → Pages → *Deploy from a branch* → la branche poussée, dossier `/docs`. L'URL sera `https://<compte>.github.io/<dépôt>/` (à recopier ici une fois active).
  - ou Vercel : importer le dépôt, *Build command* vide, *Output directory* `docs`.
- Contenu : 23 coffres MetaMorpho V1 (Steakhouse ETH ouvert par défaut), rapports, graphes de dépendances, empreinte sha256 de chaque manifeste et statut du dernier replay au wei.
- Reconstruction : `npm run build:static` (l'export refuse d'écrire tout motif de clé RPC ; contrôle par grep fait : aucune clé ni URL de RPC dans `docs/` ni `results/`).

## 2. Démo en direct

```bash
npm ci
npm run demo                 # en ligne
npm run demo -- --offline    # hors connexion (après un passage en ligne)
```

- Page d'état : `http://127.0.0.1:5173/#/status` (proxy, fork au bloc 26 157 638, API, mode).
- Repli automatique en replay statique si le fork ne répond plus ; relance automatique des processus (testé : fork tué à 16:40:50, relancé à 16:40:53).
- Scripts de présentation (90 s et 3 min) : `DEMO.md`.

## 3. Vidéo de secours

- Chemin prévu : `video/exitproof-demo-90s.mp4` (à enregistrer par Alex sur une vraie exécution de `npm run demo`, en suivant le script 90 s de `DEMO.md`).
- Non versionnée tant qu'elle n'existe pas ; si elle dépasse ~50 Mo, la publier hors du dépôt et mettre le lien ici.

## 4. Preuves reproductibles

- `npm run replay` (Steakhouse ETH) ou `npm run replay -- 0x<coffre>` ; `npm run test:fork` (9 tests) ; `npm test` (14 tests) ; `npm run test:e2e` (90 vérifications de bout en bout dans Chrome : site statique en HTTP et en file://, 1440 et 375 px, et mode live si `npm run demo` tourne ; sinon la partie live est sautée et annoncée) ; `E2E_URL=https://… npm run test:e2e:url` pour une copie déployée (GitHub Pages).
- Sorties brutes sur clone propre, hors connexion : `results/clean-clone-check/`.
- Manifestes : `results/manifests/*.json` ; rapports : `results/reports/*.json` ; graphes : `results/discovery/*.json`.

## 5. Limites connues (résumé ; détail dans le README, « Known limitations »)

- **Mesuré sur fork** : la liquidité de sortie (montants, reverts, coussin). **Modélisé, borne basse** : la perte de valeur en incident. **Hypothèse** : la probabilité de l'incident ; rien n'est prédit.
- Le point mort dépend fortement du coût attribué aux fonds bloqués : Steakhouse ETH 1,13 % (10 %) contre 5,57 % (0 %) sur 30 jours ; 463 des 580 WETH de perte viennent de cette hypothèse.
- Un seul bloc figé : pas de dynamique (remboursements, taux, réallocation par le curateur). Pas de validation sur un incident passé réel.
- Capacité AMM = borne basse (Uniswap V3 et Curve seulement) ; backstop du Public Allocator = borne haute.
- MetaMorpho V1.0/V1.1 seulement. Candidats (coffres pairs, emprunteurs, détenteurs) issus de l'API Morpho et vérifiés on-chain ; couverture mesurée.
- Un coffre jamais analysé en ligne ne peut pas l'être hors connexion.
- Affichage mobile vérifié à 600 px de large ; en dessous de ~500 px, Chrome headless sous Windows ne rend pas la page (non vérifié sur un vrai téléphone).
- Pas un conseil en investissement, pas un audit, pas une notation.
