Lis d'abord CLAUDE.md dans ce dossier : c'est la source de vérité.

Contexte : on participe au hackathon BSA EPFL (hacking jusqu'à dimanche 11 octobre 10:00, heure de Lausanne), track Belem Capital « DeFi Risk Dependency Challenge ». Le dossier de recherche est dans C:\Users\Lenovo\EPFL_HACKATHON_RESEARCH_2026, en lecture seule. Lis-y au minimum 12_architecture_exitproof.md, 10_preflight_exitproof.md et 11_jour_J.md pour les faits et les pièges techniques. Ne copie pas son dossier _preflight/ : tout le code du projet est réécrit de zéro ici.

Ta mission : construire un prototype fonctionnel sur données réelles qui, pour un coffre MetaMorpho V1, (1) découvre ses dépendances (marchés, collatéraux, oracles et leurs feeds, autres coffres), (2) propage des chocs explicites et mesure la perte de valeur et de liquidité de sortie, (3) rend un verdict rester ou sortir avec la probabilité d'incident de point mort, et (4) prouve les sorties de liquidité par exécution sur un fork local rejouable au wei, y compris hors connexion.

Commence par la phase 0 du plan : dépôt neuf, proxy RPC, fork au bloc 26 157 638, moteur qui retrouve 5 209,91 WETH / revert NotEnoughLiquidity / 4 210,68 WETH. Puis enchaîne les phases dans l'ordre, en gardant toujours un état démontrable de bout en bout.

Règles : suis CLAUDE.md à la lettre sur l'honnêteté des résultats, l'origine du code, l'absence de secret dans git et l'absence de git push. Tiens PROGRESS.md et NOTES.md à jour, commit après chaque étape importante, vérifie l'heure avec Get-Date, gel des fonctionnalités dimanche 08:30. Travaille aussi longtemps que nécessaire sans attendre ma validation sur les détails ; pose-moi une question courte seulement si un choix change le périmètre ou touche aux règles du concours.
