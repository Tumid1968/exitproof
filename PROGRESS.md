# PROGRESS

## Fait (sam. 10 oct.)
- **Phase 0** : proxy RPC local (cache disque des requêtes à bloc figé, reverts compris ; online/offline ; statut GET), fork Hardhat 3.19.0 au bloc 26 157 638, moteur de retrait (snapshot persistant, impersonation, T0+12k, décodage des reverts). Valeurs de référence retrouvées au wei.
- **Phase 1** : découverte sourcée, générique pour tout coffre MetaMorpho V1 : chaîne, coffre (version via factories), gouvernance (Safe), marchés, IRM, collatéraux (proxy/admin/owner/masterMinter, stETH/Lido + kernel), oracles (forme Morpho, routeurs primaire/secours, clones EIP-1167, formules lisibles), feeds + agrégateurs + owners, coffres pairs, détenteurs (top 25 vérifiés on-chain), emprunteurs (couverture 100 %), Public Allocator (liquidité nette), **couche AMM** (pools Uniswap V3/Curve, via unwrap et en deux sauts via WETH ; capacité de liquidation au seuil de rentabilité).
- **Phase 2** : chocs analytiques le long du graphe (feed vu par l'oracle, décrochage aveugle, surévaluation), deux régimes de liquidation (tout absorbé / limité par la profondeur AMM) ; chocs exécutés sur fork (oracle remplacé, liquidations réelles, mauvaise dette lue dans `Liquidate`). Recoupements analytique/exécuté concordants.
- **Phase 3** : verdict rester/sortir, point mort, sensibilité ; 3 incidents par coffre (aveugle + course, choc + liquidations + course, choc + liquidations limitées AMM + course).
- **Phase 4** : manifestes par coffre (sha256) + replay au wei, vert en ligne et hors connexion ; `npm run all` (découverte → rapport → replay) sur 3 coffres.
- **Phase 5** : API locale + interface React (sélecteur de coffre, graphe cliquable avec provenance, sorties exécutées en direct, chocs + chemin en rouge, table AMM, verdict à curseurs, preuves/replay).
- **Phase 6 (en partie)** : tests unitaires (8) et d'acceptation sur fork (7), README, DEMO.md.
- Bug Hardhat 3 contourné : `evm_revert` ne défait pas `hardhat_setCode` → code d'oracle restauré depuis l'archive + garde-fou de prix.

## En cours
- Validation hors connexion complète du pipeline (proxy offline + nœud redémarré)
- Finitions interface

## Bloqué
- (rien)

## Reste à faire
- Vidéo (après une vraie exécution), soumission (Alex)
