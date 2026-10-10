# PROGRESS

## Fait (sam. 10 oct.)
- Phases 0 à 5 : voir historique git et NOTES 1-19 (moteur, découverte sourcée, chocs, verdict, replay au wei en ligne/hors connexion, interface).
- Revue de code indépendante : 3 défauts corrigés (NOTES 18). Copie fraîche : replay vert à froid (NOTES 19).
- **Priorités d'Alex (sam. ~12:20)** :
  1. Robustesse `/api/analyze` : tâche de fond + suivi, erreurs 400/409/422/503 lisibles, filet anti-crash ; banc de 12 cas (7 coffres inconnus, 5 entrées invalides) tout vert ; découverte d'un coffre inconnu < 1 min (NOTES 21).
  2. Verdict : horizon, rendement (APY net lu on-chain) et coût du bloqué affichés à côté du point mort.
  3. Fraîcheur des feeds : intervalle max et variation de déclenchement observés (24 rounds) ; alerte seulement si l'âge dépasse l'intervalle observé (NOTES 22).
  4. Registre des preuves (mesuré / exécuté / borné / modélisé / hypothèse) avec sources et hypothèses, dans le rapport et l'interface.
  5. Public Allocator exécuté (scénario d'atténuation) : Steakhouse USDT 46,73 M → 50,47 M sortables (NOTES 23).
  6. README et DEMO.md à jour.
- Tests : 13 unitaires, 7 d'acceptation sur fork ; 11 coffres en résultats, tous rejoués au wei.

## En cours
- (rien)

## Bloqué
- (rien)

## Reste à faire (Alex)
- Vidéo, git push, soumission.
