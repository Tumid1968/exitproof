# PROGRESS

## Fait (sam. 10 oct.)
- Phases 0 à 5 et première série de priorités d'Alex : voir NOTES 1-26 et l'historique git.
- **Deuxième série d'Alex (sam. ~14:30)** :
  1. Interface réordonnée : phrase de verdict en tête (rester/sortir, point mort, référence de spread, dépendance dominante), puis « What I really get back » (seul / après un gros détenteur / après un déposant d'un autre coffre, chacun ré-exécutable en direct), puis décision, puis le « pourquoi » (graphe, sorties détaillées, chocs, file de retrait), registre des preuves, replay.
  2. Trois probabilités côte à côte : point mort, probabilité implicite par le spread (Sky Savings Rate lu on-chain pour USD, staking Lido 7 jours mesuré on-chain pour WETH ; pas de référence pour BTC ; « inactif » non montré car égal au point mort), curseur utilisateur. Aucune fréquence historique (pas de source datée).
  3. README « Existing work (Travaux existants) » : Credora/RedStone (PSL, API sur liste blanche → rien d'intégré), DefiLlama (pages de risque), PD ≈ spread / LGD ; accroche recentrée sur la sortie exécutée.
  4. 20 plus gros coffres V1 par TVL pré-analysés (23 coffres au total, tous rejoués au wei) ; refus expliqué pour V2 (détection on-chain des adaptateurs), autre ERC-4626, jeton, portefeuille.
  5. README « Known limitations (Limites connues) ».
  6. DEMO.md : scripts 90 s et 3 min, ouverture sur l'ordre des sorties exécuté en direct.
- Robustesse : relance sur ECONNRESET pour les appels idempotents ; pipeline qui continue si un coffre échoue.

## En cours
- Régénération des 23 rapports (phrase de verdict corrigée), tests, commit.

## Reste à faire (Alex)
- Vidéo, git push, soumission.
