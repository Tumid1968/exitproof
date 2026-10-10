# NOTES — décisions prises en autonomie

1. Le cache de fork de `_preflight/` n'est pas copié (règle CLAUDE.md) : il est reconstruit par une exécution en ligne.
2. Le proxy garde son propre cache disque des requêtes déterministes (bloc explicite). Il sert aussi la découverte des dépendances hors connexion. Les requêtes « latest » ne sont jamais mises en cache.
3. dRPC gratuit limite `eth_getLogs` à 10 000 blocs par requête.
4. dRPC gratuit ne sert `eth_getLogs` que près de la tête de chaîne (et limite le débit) : impossible d'énumérer l'historique d'événements. **Décision** : l'API publique Morpho (GraphQL) sert uniquement à lister des *candidats* (coffres qui fournissent un marché, emprunteurs). Chaque candidat est relu par `eth_call` au bloc figé, et la complétude est mesurée on-chain (Σ parts trouvées / parts totales du marché : 100 % de la dette identifiée pour les 3 marchés exposés de Steakhouse ETH). Les réponses de l'API sont en cache disque pour le mode hors connexion.
5. L'API reflète l'état « actuel » (~3 000 blocs après le bloc figé) : un emprunteur fermé entre-temps serait manqué ; la couverture on-chain le révélerait (< 100 %).
6. Liquidateur des scénarios de choc : adresse fixe impersonée `0x…E1F0`, financée en ETH local puis WETH. Hypothèse affichée : les liquidateurs ont le capital et liquident tout. Le régime « liquidations bloquées » est représenté par le cas « oracle aveugle ».
7. Perte économique du décrochage aveugle = Σ max(0, dette − collatéral × prix de marché choqué) des emprunteurs, au prorata des parts du coffre. Hypothèse : le décrochage persiste et les emprunteurs sous l'eau ne remboursent pas. Ce n'est pas une perte constatée on-chain : affiché comme tel.
8. Probabilité d'incident par défaut dans le rapport (5 % sur 30 jours) et décote du bloqué (10 %) : valeurs de démonstration, modifiables dans l'interface, présentées comme hypothèses de l'utilisateur.
9. Hardhat 3 ne supporte pas `hardhat_reset` : l'identifiant du snapshot de base est persisté dans `cache/fork-base-snapshot.json` pour revenir à l'état source entre deux processus.
