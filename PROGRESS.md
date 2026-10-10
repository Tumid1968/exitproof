# PROGRESS

## Fait
- **Phase 0** (sam. ~10:55) : proxy RPC local (cache disque des requêtes à bloc figé, y compris les reverts ; modes online/offline), fork Hardhat 3.19.0 au bloc 26 157 638 via 127.0.0.1:8600, moteur de retrait TypeScript/viem (snapshot persistant, impersonation, horodatage T0+12k, décodage des reverts).
- **Phase 1** : découverte des dépendances sourcée (chaque nœud/lien liste ses lectures `eth_call`/`eth_getStorageAt`/`eth_getCode`) : chaîne, coffre (version via `isMetaMorpho` des factories, owner/curator/guardian et Safe), marchés de la file, IRM, collatéraux (proxy/admin, owner, masterMinter, stETH/Lido + kernel Aragon), oracles (forme Morpho, routeur primaire/secours avec défi de déviation, clones EIP-1167), feeds Chainlink + agrégateurs + owner, coffres pairs, emprunteurs (couverture mesurée on-chain : 100 % de la dette), Public Allocator (0 WETH réallouable).
  - Steakhouse ETH : 60 nœuds, 89 liens, 547 lectures ; Steakhouse USDC : 99 nœuds ; Gauntlet WETH Prime : 50 nœuds.
- **Phase 2** : chocs analytiques propagés le long du graphe (feed → oracle → marché → emprunteurs → coffre → détenteur), décrochage « aveugle » (oracle inchangé), surévaluation d'oracle ; chocs exécutés sur fork (oracle remplacé par une constante, liquidations réelles, mauvaise dette lue dans l'événement `Liquidate`). Recoupement : Lido −10 % → 90/90 liquidations, perte coffre 293,106 (exécuté) vs 293,084 (analytique).
- **Phase 3** : verdict rester/sortir (`src/verdict/verdict.ts`), point mort, sensibilité (horizon × décote du bloqué, taille du décrochage).
- **Phase 4** : `results/manifest.json` (sha256) + `npm run replay` : 12 scénarios + coussin identiques au wei, **y compris hors connexion** (proxy offline, nœud redémarré). Test négatif : 1 wei modifié → FAIL.
- Valeurs de référence toutes retrouvées au wei : A seul 5 209,914854809315636083 ; B → revert 0x4323a555, max 4 210,679414346963425094 ; B+C 3 489,008… ; VB1 3 318,751… ; B deux coffres 2 079,210… ; coussin 1 736,990 / 1 736,991.

## En cours
- Phase 5 : interface React + Vite

## Bloqué
- (rien)
