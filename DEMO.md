# Démo ExitProof — parcours de 90 s

Tous les chiffres ci-dessous sont produits par ce dépôt (`npm run all`, replay vert). Bloc figé 26 157 638.

## Avant de monter sur scène

```bash
npm run proxy:offline     # ou npm run proxy si le Wi-Fi est fiable
npm run fork
npm run api
npm run web               # http://127.0.0.1:5173
```

Vérifier dans le bandeau : `proxy: offline` (ou online) et `fork: up`. Cliquer une fois « Replay everything now » (≈ 20 s), il doit afficher **REPLAY OK**.

## Parcours (Steakhouse ETH, plus gros détenteur)

| Temps | Écran | À dire |
|---|---|---|
| 0–10 s | Bandeau « Local fork of Ethereum — block 26,157,638 », section 1 | « Une position de 5 210 WETH, 54 % d'un coffre Morpho. L'interface dit 71 % liquide. Que se passe-t-il vraiment si ça casse ? » |
| 10–25 s | Section 2 : graphe, constats | « On part de la seule adresse du coffre. Chaque boîte est une lecture on-chain, cliquable. Les deux marchés wstETH, 99,8 % du coffre, sont pricés **uniquement** par le taux de change wstETH/stETH : un décrochage de marché du stETH est invisible pour les liquidations. Le marché cbBTC passe par un routeur dont la jambe active lit BTC/USD, pas cbBTC/USD. » |
| 25–45 s | Section 3 : cliquer « Vault Bridge WETH #1 » puis Execute on fork | « Cet acteur n'a aucune part dans notre coffre. Il sort du sien : notre sortie complète revert, `NotEnoughLiquidity`, max 3 318,75 WETH, −36 %. Exécuté à l'instant sur le fork. Coussin : 1 736,99 WETH, mesuré par dichotomie. » |
| 45–65 s | Section 4 : ligne « wstETH/stETH exchange rate feed x0.9 », chemin rouge dans le graphe ; tableau AMM | « Choc Lido −10 % : 90 liquidations, 293 WETH de mauvaise dette pour le coffre, recoupée par exécution réelle. Mais les pools DEX mesurés au bloc n'absorbent à profit que 74 % du collatéral du marché 96,5 % : avec cette limite, 45 positions restent insolvables. » |
| 65–80 s | Section 5 : incident « stETH depegs… oracle unchanged » ; bouger le curseur de probabilité | « Pire régime : oracle aveugle, aucune liquidation, et la course à la sortie vide la liquidité : il ne reste que 582 WETH retirables sur 5 210. Point mort : 1,13 % de probabilité sur 30 jours. Au-dessus, sortir. La probabilité est votre hypothèse, pas une prédiction. » |
| 80–90 s | Section 7 : Replay ; puis coller une adresse dans « Analyze » (ex. Steakhouse USDT `0xbEef047a543E45807105E51A8BBEFCc5950fcfBa`, déjà en cache) | « Tout est rejouable au wei, même sans Internet. Et ça marche sur n'importe quel coffre V1 : collez une adresse. Sur Steakhouse USDT, l'appel au Public Allocator, exécuté, remonte la sortie possible de 46,7 M à 50,5 M. » |

## Questions probables

| Question | Réponse (vérifiée par le code) |
|---|---|
| « C'est juste `maxWithdraw` ? » | `maxWithdraw` donne l'état d'un seul coffre à un instant. Nous exécutons des **séquences** entre coffres : avant la sortie de Vault Bridge #1, `maxWithdraw` dit 5 209,91 ; après, 3 318,75. |
| « Et si le juge colle sa propre adresse ? » | Analyse en tâche de fond, étape affichée ; testée sur 7 coffres inconnus et 5 entrées invalides (messages lisibles : adresse invalide, pas un coffre V1, RPC injoignable). Un coffre jamais vu prend ~1 à 5 min en ligne. |
| « Un âge de 10 h pour un feed, c'est une panne ? » | Non : sur ses 24 derniers rounds, cbBTC/USD s'est mis à jour au plus toutes les 24 h ou sur ~2 % de variation (observé on-chain). 10,1 h est normal ; l'interface ne l'affiche comme alerte que si l'âge dépasse l'intervalle maximal observé. |
| « Le Public Allocator rééquilibre » | Calculé au bloc : 0 WETH de liquidité nette réallouable vers les marchés de Steakhouse ETH. Quand il y en a, nous l'exécutons : Steakhouse USDT, 46,7 M → 50,5 M sortables. |
| « Données réelles ? » | Contrats et état réels au bloc 26 157 638 ; transactions simulées sur un fork local ; acteurs impersonés = hypothèse de scénario. Les candidats (coffres pairs, emprunteurs, détenteurs) viennent de l'API Morpho, chacun est relu on-chain, et la couverture est mesurée on-chain (100 % de la dette). |
| « Votre modèle de perte est simpliste » | Il est recoupé : analytique 293,084 vs exécuté 293,106 WETH (différence = intérêts courus pendant les 90 liquidations). Hypothèses affichées à côté de chaque chiffre. |
| « La contagion entre coffres, c'est connu » | Oui (LlamaRisk, articles sur les marchés partagés). Notre apport : l'exécuter et la chiffrer pour une position et un bloc, avec replay. |
| « Pourquoi pas de USD ? » | Aucun prix USD sourcé et daté n'est utilisé : unités natives. |
| « Et Morpho V2 ? » | Refusé explicitement (sémantique de `max*` différente). |

## À ne pas dire

« garanti », « prédiction », « audit », « certifié », le nom auto-déclaré du contrat du plus gros détenteur, « aucun outil ne fait ça », « fonctionne sur tous les coffres » (dire : « tout coffre MetaMorpho V1, montré sur trois »).
