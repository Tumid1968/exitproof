# CLAUDE.md — ExitProof pour le track Belem Capital (BSA EPFL, 10-11 octobre 2026)

Tu travailles avec Alex (étudiant ESILV, finance de marché, Python/TypeScript). Il est présent pendant le hackathon. Langue de travail : français (code et identifiants en anglais).

## 1. Objectif

Gagner le **Belem Capital Track, "DeFi Risk Dependency Challenge"** : un système de risque fonctionnel qui, pour une position on-chain, (1) découvre automatiquement ses dépendances cachées, (2) quantifie ce qui se passe quand l'une d'elles échoue, (3) répond à la vraie décision d'un gérant : **la perte attendue en restant justifie-t-elle de sortir malgré le slippage et les coûts d'exécution ?**

Grille de jugement officielle :
- Découverte des dépendances : 30 %
- Estimation d'impact : 30 %
- Utilité de la décision (rester ou sortir, et pourquoi) : 25 %
- Qualité de la démo fonctionnelle sur données réelles : 15 %

Le brief insiste : prototype fonctionnel sur données réelles, pas des slides. Les meilleurs dossiers expliquent comment un incident se **propage dans la pile de dépendances** et quel est l'impact portefeuille. Le brief cite l'exemple d'une position Pendle PT à cinq couches (chaîne de règlement, source de rendement sous-jacente, oracle, marché AMM, marché de prêt). Viser une cartographie de profondeur comparable.

Soumission : lien GitHub/GitLab/Bitbucket **obligatoire**. Fin du hacking : dimanche 11 octobre 10:00 (heure de Lausanne). DoraHacks affiche 11:00, non confirmé : viser 10:00.

## 2. Produit : ExitProof recadré

Entrée : l'adresse d'un coffre MetaMorpho V1 (ou une position dans ce coffre). Sorties :
1. **Graphe de dépendances sourcé** : chaque lien porte sa provenance (appel on-chain, bloc, adresse). Aucun lien déduit sans lecture de contrat.
2. **Propagation de chocs** paramétrés explicitement (ex. décrochage d'un collatéral, panne ou dérive d'oracle, sorties massives dans d'autres coffres) avec la perte de valeur et la perte de liquidité de sortie qui en résultent.
3. **Verdict rester / sortir** : perte attendue contre coût de sortie, avec la **probabilité d'incident de point mort** (celle pour laquelle les deux s'égalisent) et une analyse de sensibilité. Les probabilités sont des hypothèses de l'utilisateur, jamais des prédictions : le dire à l'écran.
4. **Preuve exécutée** : les sorties de liquidité sont exécutées sur un fork local d'Ethereum à bloc figé, rejouables au wei, y compris hors connexion.

### Couches de dépendances à cartographier (à vérifier par lecture on-chain, ne rien supposer)
- Chaîne de règlement (Ethereum, chainId 1) et son RPC archive.
- Le coffre : version MetaMorpho (V1.0 / V1.1), curateur, allocateurs, file de retrait.
- Chaque marché Morpho Blue de la file : paramètres (loan token, collatéral, oracle, IRM, LLTV), utilisation, liquidité.
- Les tokens de collatéral (wstETH, cbBTC, WBTC) et leur source de rendement ou de garde sous-jacente (ex. Lido pour wstETH).
- L'oracle de chaque marché : lire ses feeds en dessous (adaptateurs Morpho, feeds Chainlink ou autres) et leur fraîcheur.
- Les autres coffres qui prêtent dans les mêmes marchés (contagion entre coffres, déjà démontrée : -36 % et -60 %).
- Le Public Allocator (vérifié : 0 WETH réallouable au bloc).

## 3. Règles impératives

**Dépôt et origine du code**
- Crée un **dépôt neuf** dans `C:\Users\Lenovo\exitproof` et écris tout le code de zéro pendant l'événement.
- Le dossier `C:\Users\Lenovo\EPFL_HACKATHON_RESEARCH_2026` est en **lecture seule** : tu peux lire les documents et reprendre les **faits** (adresses, blocs, valeurs de référence). **Ne copie pas `_preflight/`** dans le dépôt, ne le réutilise pas. La règle du concours sur le code préexistant n'est pas connue.
- Le README doit contenir une section « Origine des composants » : ce qui a été écrit pendant l'événement, les bibliothèques et leurs licences, la préparation antérieure (recherche et vérification de faisabilité de la nuit du 9 au 10 octobre) et l'assistance IA utilisée (Claude Code). Transparence totale.
- Aucun secret dans git (clé RPC en variable d'environnement, `.env` ignoré). Aucun `git push` sans demande explicite d'Alex : il publie lui-même.

**Honnêteté des résultats**
- Distinguer partout **donnée réelle lue on-chain**, **transaction simulée sur fork local**, **hypothèse de scénario** (acteurs impersonés, probabilités, chocs).
- Interdit : « garanti », « prédiction », « audit », « certifié », « aucun outil ne fait ça ». Ne pas nommer l'entité derrière le contrat du détenteur A (nom auto-déclaré, non vérifié) : dire « le plus gros détenteur ».
- La contagion entre coffres est un mécanisme **déjà documenté** (LlamaRisk, articles sur les marchés partagés). L'apport est de l'exécuter et de la chiffrer pour une position et un bloc précis.
- Aucun chiffre USD sans prix sourcé et daté. Unités natives (WETH) par défaut.
- Les chiffres du pitch doivent être produits par **ton** code avant d'être annoncés.

**Technique**
- Pile : TypeScript, viem, Hardhat 3 (fork), React + Vite. Node v24.14.1 présent. Pas de base de données, pas d'IA dans le calcul.
- Aucune transaction réelle envoyée sur Ethereum : uniquement `eth_call` et lectures sur le RPC, `eth_sendTransaction` sur le nœud local.
- RPC archive gratuit utilisable sans clé : `https://eth.drpc.org` (seul fournisseur testé qui sert l'historique). Alex peut fournir une clé de secours.
- Forker **via un proxy local** `127.0.0.1:8600` (le cache Hardhat est indexé par hôte:port). Le nœud plante si `eth_blockNumber` ne répond pas : en mode offline, le proxy répond une constante. Voir `12_architecture_exitproof.md` §1–2 dans le dossier de recherche.
- Horloge figée : `evm_setNextBlockTimestamp(T0 + 12k)` pour chaque transaction de rang k. Comparer montants, statuts et erreurs, pas les hash de transactions locales.
- Impersonation de contrats (Safe, proxy) : `hardhat_impersonateAccount` puis `hardhat_setBalance` à 10 ETH.
- Les reverts reviennent en erreur JSON-RPC : lire `error.data` et décoder (`0x4323a555` NotEnoughLiquidity, `0xe450d38c` ERC20InsufficientBalance, `0xfb8f41b2` ERC20InsufficientAllowance).
- Périmètre : MetaMorpho **V1** uniquement. Refuser explicitement V2 (sémantique de `max*` différente).

## 4. Données de référence (bloc figé 26 157 638)

Hash du bloc `0x3e8450286456e913f08f2290aa3eac5e0c8b6d5be51bef3955032d9c43977bf4`, timestamp 1791582443.

- Coffre : Steakhouse ETH `0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4` (MetaMorpho V1.0, actif WETH `0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`). 9 718,21 WETH au total, 6 946,905 retirables.
- Morpho Blue : `0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb`.
- A, plus gros détenteur : `0x27F23c710dD3d878FE9393d93465FeD1302f2EbD` (5 209,91 WETH).
- B, Safe 3/5 : `0x9fC3dc011b461664c835F2527fffb1169b3C213e` (2 736,23 WETH ici, 2 131,47 dans Gauntlet WETH Prime).
- C : `0x5EC6abfF9BB4c673f63D077a962A29945f744857`. D : `0x5a91cE2E8E201aaDe717246F04f9618A58eF9931`.
- VB1, n°1 d'un autre coffre : `0x80845058350B8c3Df5c3015d8a717D64B3bF9267` dans Vault Bridge WETH `0x31A5684983EeE865d943A696AAC155363bA024f9`.

**Valeurs que ton moteur doit retrouver au wei** (test d'acceptation, puis consulter `_preflight/golden_values.json` du dossier de recherche en lecture seule pour la comparaison complète) :

| Scénario | Sortie max de A |
|---|---:|
| A seul | 5 209,91 WETH (sortie complète réussit) |
| C, D ou C+D sortent d'abord | 5 209,91 (aucun effet) |
| B sort d'abord | 4 210,68 (sortie complète revert `NotEnoughLiquidity`) |
| B puis C | 3 489,01 |
| VB1 sort d'un autre coffre | 3 318,75 (-36 %) |
| B sort de ses deux coffres | 2 079,21 (-60 %) |

Coussin avant blocage : 1 736,99 WETH (sortie complète passe à 1 736,990, revert à 1 736,991 : dichotomie sur fork).
File de retrait : marchés wstETH n°1 (1 384,02 retirables, utilisation 84,9 %) et n°2 (5 559,44, 83,6 %) ; environ 2 771 WETH du coffre sont prêtés (≈2 755 contre wstETH, ≈17 contre cbBTC). Si une valeur diffère, vérifier d'abord bloc, convention d'horodatage et ordre des étapes avant de soupçonner le moteur.

## 5. Plan (heure de Lausanne, hacking jusqu'à dimanche 10:00)

| Phase | Contenu | Livrable / critère |
|---|---|---|
| 0 | Dépôt neuf, proxy RPC, fork au bloc figé, moteur de retrait | Retrouve 5 209,91 / revert / 4 210,68 WETH |
| 1 | **Découverte des dépendances** (couches §2), provenance de chaque lien, au-delà du seul coffre : oracles, feeds, collatéral, autres coffres | Graphe JSON sourcé pour Steakhouse ETH, puis pour au moins un deuxième coffre pour montrer la généralité |
| 2 | **Moteur de chocs** : décrochage de collatéral, oracle, sorties massives ; perte de valeur et de liquidité | Tableau de résultats par choc, hypothèses explicites |
| 3 | **Verdict rester/sortir** : perte attendue, coût de sortie (liquidité non retirable, slippage), probabilité de point mort, sensibilité | Décision lisible en une phrase + preuve exécutée |
| 4 | **Manifeste + replay** au wei, mode hors connexion, préchauffage du cache | Replay vert sur copie fraîche du dépôt |
| 5 | **Interface** : position, graphe de dépendances, choc, verdict, preuves ; label permanent « fork local, bloc 26 157 638 » | Parcours de démo de 90 s |
| 6 | Tests, README (fonctionne / partiel / exclu), vidéo, soumission | Gel des fonctionnalités à 08:30, soumission à 09:00-09:30 |

Priorité absolue : une démo de bout en bout fonctionnelle (adresse de coffre -> dépendances -> choc -> verdict) avant toute finition. En cas de retard, couper la qualité visuelle avant de couper une couche de la grille (dépendances, impact, décision).

## 6. Fonctionnement autonome

- Vérifie l'heure avec `Get-Date` régulièrement. Gel des fonctionnalités à dimanche 08:30.
- Un commit git après chaque amélioration importante, sur une branche de travail.
- Tiens `PROGRESS.md` à jour : fait, en cours, bloqué. Décisions ambiguës dans `NOTES.md` plutôt que de t'arrêter ; si une décision est irréversible ou touche aux règles du concours, pose la question à Alex.
- Ne supprime rien en dehors du dépôt `exitproof`. Pas d'action destructive, pas de `git push`.
- Alex est présent : pose des questions courtes quand un choix change le périmètre.

## 7. À faire vérifier par Alex (pas par toi)

- Règle du concours sur le code préexistant et l'usage de l'IA (brief détaillé « More informations here » sur DoraHacks, ou bsa@epfl.ch).
- Heure limite exacte de soumission (10:00 ou 11:00).
- Clé RPC archive de secours (Alchemy ou Infura).
