# NOTES — décisions prises en autonomie

1. Le cache de fork de `_preflight/` n'est pas copié (règle CLAUDE.md) : il est reconstruit par une exécution en ligne.
2. Le proxy garde son propre cache disque des requêtes déterministes (bloc explicite). Il sert aussi la découverte des dépendances hors connexion. Les requêtes « latest » ne sont jamais mises en cache.
3. dRPC gratuit limite `eth_getLogs` à 10 000 blocs par requête.
