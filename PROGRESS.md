# PROGRESS

## Fait
- Phase 0 (sam. 10:58) : dépôt neuf, proxy RPC local (cache disque des requêtes à bloc figé, modes online/offline), fork Hardhat 3.19.0 au bloc 26 157 638 via 127.0.0.1:8600, moteur de retrait TypeScript/viem (snapshot, impersonation, horodatage T0+12k, décodage des reverts).
  - A seul : 5 209,914854809315636083 WETH (identique au wei à la référence)
  - B puis A (tout) : revert 0x4323a555 NotEnoughLiquidity ; maxWithdraw(A) = 4 210,679414346963425094
  - B puis A (max) : 4 210,679414346963425094 WETH

## En cours
- Phase 1 : découverte des dépendances

## Bloqué
- (rien)
