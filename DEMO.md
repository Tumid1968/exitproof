# Démo ExitProof

Tous les chiffres ci-dessous sont produits par ce dépôt (`npm run all`, replays verts). Bloc figé 26 157 638 (9 oct. 2026, 21:47 UTC).

## Avant de monter sur scène (5 min avant)

```bash
npm run demo                 # ou : npm run demo -- --offline   (Wi-Fi douteux ; tout est en cache)
```

La commande lance proxy, fork, API et interface, les surveille, relance un processus qui tombe et ouvre le navigateur sur `http://127.0.0.1:5173/`.
- Vérifier `http://127.0.0.1:5173/#/status` : tout en vert, fork au bloc 26 157 638, mode en ligne / hors connexion.
- Cliquer une fois « Execute again on the fork » dans la section 1 pour chauffer le fork (< 1 s ensuite).
- **Plan B sans rien** : ouvrir `docs/index.html` (double-clic) ; mêmes écrans, résultats rejoués depuis les manifestes, bandeau explicite.
- Si le fork tombe pendant la démo, l'interface bascule seule en replay statique (bandeau jaune) ; le superviseur relance le fork en ~3 s.

Adresses utiles : Steakhouse ETH `0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4` (par défaut) · Steakhouse USDT `0xbEef047a543E45807105E51A8BBEFCc5950fcfBa` (Public Allocator exécuté) · coffre Morpho V2 pour le refus expliqué `0x0229dB3921dE71CFa43Cfe9fb6A87b403647A9ae`.

## Script 90 secondes (commence par l'ordre des sorties)

| Temps | À l'écran | À dire |
|---|---|---|
| 0–25 s | Section 1 « What I really get back ». Cliquer la ligne « Vault Bridge WETH #1 exits its own vault », puis « Execute again on the fork » | « Une position de 5 210 WETH dans un coffre Morpho. Même bloc, même état. Seul, je sors 5 209,91. Si un déposant d'**un autre coffre**, qui n'a aucune part du mien, sort avant moi : ma sortie complète revert — NotEnoughLiquidity, 0x4323a555 — je ne récupère que 3 318,75, −36 %. Exécuté à l'instant, identique au wei. » |
| 25–40 s | Lignes « holder #2 exits » puis « holder #2 exits Gauntlet WETH Prime → this vault » ; phrase du coussin | « Le n°2 de mon coffre sort d'abord : −19 %. S'il sort de ses deux coffres : 2 079 WETH, −60 %. Coussin mesuré par dichotomie : tant que moins de 1 736,99 WETH sortent avant moi, rien ne change. » |
| 40–60 s | Phrase de verdict en haut, ligne « mesuré / modélisé / hypothèse » | « Faut-il sortir ? Sortir devient rentable si vous estimez ce décrochage plus probable que 1,13 % sur 30 jours — 5,57 % si l'on compte à zéro le coût d'être bloqué. Nous ne prédisons rien : la liquidité est mesurée sur fork, la perte est modélisée, borne basse, la probabilité est la vôtre. » |
| 60–80 s | Section 2 : interrupteur 10 % / 0 %, les trois tuiles | « 463 des 580 WETH de perte viennent de l'hypothèse sur le bloqué : on la montre. Le spread ne dit rien ici : le coffre rapporte 1,53 %, moins que le staking ETH à 2,24 %. Et votre curseur donne la lecture rester ou sortir. » |
| 80–90 s | Onglet Dependencies (7 couches), puis Replay | « Le pourquoi : la pile découverte depuis l'adresse seule, chaque lien a sa lecture on-chain ; les deux marchés wstETH sont pricés par le seul taux de change. Tout est rejouable au wei, même sans Internet. » |

## Script 3 minutes

| Temps | À l'écran | À dire |
|---|---|---|
| 0–45 s | Section 1 : les 6 lignes ; exécuter en direct « Vault Bridge » puis « holder #2 » | Ordre des sorties comme dans le script 90 s (seul 5 209,91 ; #3/#4 sans effet ; n°2 4 210,68 ; n°2 puis n°3 3 489,01 ; autre coffre 3 318,75 ; n°2 sur ses deux coffres 2 079,21). « Credora note le coffre, DefiLlama décrit ses risques ; ici, c'est **votre** sortie, exécutée, selon l'ordre des départs. » |
| 45–75 s | Phrase de verdict + ligne d'honnêteté ; section 2 : horizon 7/30/90 j, interrupteur 10 % / 0 % | « Point mort 1,13 % (30 j, bloqué à 10 %), 5,57 % à 0 % : nous montrons la fourchette, pas un chiffre. Coût de sortie : 6,54 WETH de rendement abandonné à 1,53 % net, gaz exécuté sur fork. » |
| 75–110 s | Onglet Dependencies : 7 couches, constats, clic sur le nœud oracle | « Oracles, feeds, Lido, routeur cbBTC, 8 coffres pairs, 162 emprunteurs identifiés à 100 % de la dette, pools AMM. La fraîcheur d'un feed est jugée contre son intervalle observé : cbBTC/USD a 10 h, normal pour un heartbeat de 24 h. » |
| 110–140 s | Onglet Shocks : ligne « wstETH/stETH exchange rate feed x0.9 », puis le tableau AMM et le recoupement | « Lido −10 % : 90 liquidations réelles sur le fork, 293,106 WETH de perte contre 293,084 en analytique. Les pools DEX mesurés au bloc n'absorbent à profit que 74 % du collatéral du marché 96,5 %. » |
| 140–165 s | Coller Steakhouse USDT dans « Analyze » (en cache) ; onglet Exits in detail, encadré vert ; puis coller le coffre V2 | « N'importe quel coffre V1 : ici, le Public Allocator est exécuté avant ma sortie, de 46,7 M à 50,5 M USDT. Un coffre V2 est refusé, avec la raison. » |
| 165–180 s | Onglets Evidence puis Replay ; mentionner `docs/index.html` | « Chaque chiffre est classé : mesuré, exécuté, borné, modélisé, hypothèse. Tout se rejoue au wei, et le jury peut tout ouvrir sans nous : double-clic sur docs/index.html. » |

## Questions probables

| Question | Réponse (vérifiée par le code) |
|---|---|
| « Credora et DefiLlama font déjà ça ? » | Ils notent et décrivent le risque du coffre (PSL annualisée, perte si le collatéral baisse, exposition aux oracles). Nous ajoutons la sortie exécutée selon l'ordre des départs (y compris entre coffres), le point mort face au coût de sortie mesuré, et le replay au wei. L'API Credora exige une liste blanche : rien d'intégré. |
| « Votre probabilité, d'où vient-elle ? » | Nous n'en avons pas : point mort, lecture risque-neutre du spread (Sky Savings Rate lu on-chain ; staking Lido mesuré sur 7 jours), et la vôtre. Aucune fréquence historique : pas de source datée avec échantillon. |
| « Pourquoi 1,13 % et pas 5,57 % ? » | Les deux sont affichés : 463 des 580 WETH de perte viennent du coût attribué aux fonds bloqués (10 %, hypothèse). À 0 %, p* = 5,57 %. |
| « C'est juste `maxWithdraw` ? » | `maxWithdraw` donne l'état d'un coffre à un instant. Nous exécutons des séquences entre coffres : avant la sortie de Vault Bridge #1, il dit 5 209,91 ; après, 3 318,75. |
| « Même montant 5 209,914854809315636083 dans plusieurs manifestes ? » | C'est la même transaction : le plus gros détenteur de Steakhouse ETH qui sort de son coffre en premier (k = 1, T0 + 12 s, même état source). Le moteur est déterministe, donc même résultat au wei. |
| « Et si un juge colle sa propre adresse ? » | 23 coffres pré-analysés (les 20 plus gros V1 par TVL) : instantané, y compris hors connexion. Un coffre jamais vu : ~1 à 5 min en ligne. V2, autre ERC-4626, jeton ou portefeuille : refus expliqué. |
| « Et si votre démo plante ? » | Superviseur qui relance (testé : fork tué, relancé en 3 s, exécution suivante identique au wei) ; repli automatique en replay statique ; `docs/index.html` sans rien installer. |
| « Données réelles ? » | Contrats et état réels au bloc ; transactions simulées sur un fork local ; acteurs impersonés = scénario. |

## À ne pas dire

« garanti », « prédiction », « audit », « certifié », « nouveau » à propos de la cartographie des dépendances ou des probabilités, « aucun outil ne fait ça », le nom auto-déclaré du contrat du plus gros détenteur, « fonctionne sur tous les coffres » (dire : « tout coffre MetaMorpho V1 »).
