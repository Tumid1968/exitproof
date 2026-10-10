# Démo ExitProof

Tous les chiffres ci-dessous sont produits par ce dépôt (`npm run all`, replay vert). Bloc figé 26 157 638 (9 oct. 2026, 21:47 UTC).

## Avant de monter sur scène (5 min avant)

```bash
npm run proxy            # ou npm run proxy:offline si le Wi-Fi est douteux (tout est en cache)
npm run fork
npm run api
npm run web              # http://127.0.0.1:5173
```

Vérifier dans le bandeau : `proxy: online` (ou offline) et `fork: up`. Ouvrir la page Steakhouse ETH. Cliquer une fois « Execute again on the fork » sur la première carte, pour chauffer le fork (< 1 s ensuite).

Adresses à avoir sous la main :
- Steakhouse ETH `0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4` (page par défaut)
- Steakhouse USDT `0xbEef047a543E45807105E51A8BBEFCc5950fcfBa` (Public Allocator exécuté)
- un coffre Morpho V2 pour montrer le refus expliqué : `0x0229dB3921dE71CFa43Cfe9fb6A87b403647A9ae`

## Script 90 secondes

| Temps | À l'écran | À dire |
|---|---|---|
| 0–25 s | Section 1 « What I really get back ». Cliquer « Execute again on the fork » sur la carte 3 (déposant d'un autre coffre) | « Une position de 5 210 WETH dans un coffre Morpho. Même bloc, même état. Si je sors seul : 5 209,91, tout passe. Si un déposant d'**un autre coffre**, qui n'a aucune part du mien, sort avant moi : ma sortie complète revert, je ne récupère que 3 318,75 WETH, −36 %. Exécuté à l'instant, identique au wei. » |
| 25–40 s | Carte 2, puis la phrase de coussin | « Si le n°2 de mon coffre sort d'abord : −19 %. Mais il y a un coussin : tant que moins de 1 736,99 WETH sortent avant moi, rien ne change ; au-delà, chaque WETH sorti par d'autres est un WETH que je ne sors pas. » |
| 40–60 s | Phrase de verdict en haut, puis section 2 : les trois probabilités | « Faut-il sortir ? Nous ne prétendons pas connaître la probabilité d'une crise. Nous montrons le point mort — 1,13 % sur 30 jours pour un décrochage du stETH — à côté de ce qu'implique le rendement : ici le coffre rapporte moins que le staking ETH, donc le spread ne rémunère aucun risque de défaut. Et votre propre hypothèse, au curseur. » |
| 60–80 s | Section 3 : le graphe ; cliquer le nœud oracle | « Pourquoi ? Les deux marchés wstETH, 99,8 % du coffre, sont pricés par le seul taux de change wstETH/stETH — comme le signalent aussi les pages de risque DefiLlama. Ce que nous ajoutons : en cas de décrochage, aucune liquidation, et la course à la sortie laisse 582 WETH sortables sur 5 210. » |
| 80–90 s | Section 8 : Replay | « Chaque chiffre est rejouable au wei, même sans Internet. Et collez n'importe quel coffre V1 : le moteur le découvre et l'exécute. » |

## Script 3 minutes

| Temps | À l'écran | À dire |
|---|---|---|
| 0–40 s | Section 1, les trois cartes ; exécuter en direct la carte 3 puis la carte 2 | Comme le script 90 s : seul 5 209,91 ; après le n°2 du coffre 4 210,68 (−19 %, revert `NotEnoughLiquidity`) ; après le n°1 de Vault Bridge WETH, autre coffre, 3 318,75 (−36 %). « Credora note le coffre, DefiLlama décrit ses risques ; ici, c'est **votre** sortie, exécutée, selon l'ordre des départs. » |
| 40–60 s | Section 4 : tableau complet ; ligne « holder #2 exits Gauntlet WETH Prime → holder #2 exits this vault » | « Le pire cas exécuté : le n°2 sort de ses deux coffres, je ne récupère que 2 079 WETH, −60 %. Le Public Allocator ne peut rien ajouter ici : 0 WETH réallouable, lu on-chain. » |
| 60–95 s | Section 2 : verdict ; bouger horizon et curseur ; montrer les trois tuiles | « Coût de sortie : le rendement abandonné, 1,53 % net lu on-chain, plus le gaz exécuté. Perte en cas d'incident : mesurée sur le fork. Point mort 1,13 % sur 30 jours dans le régime oracle aveugle, 4,16 % si Lido perd 10 % avec liquidations. À côté, la probabilité implicite par le spread — ici indéfinie, le coffre rapporte moins que la référence — et la vôtre. Pas de prédiction. » |
| 95–130 s | Section 3 : graphe, constats ; section 5 : sélectionner « wstETH/stETH exchange rate feed x0.9 », chemin rouge ; tableau AMM | « La pile est découverte depuis l'adresse seule, chaque lien a sa lecture on-chain. Choc Lido −10 % : 90 liquidations réelles sur le fork, 293,106 WETH de perte pour le coffre contre 293,084 en analytique. Mais les pools DEX mesurés au bloc n'absorbent que 74 % du collatéral du marché 96,5 % : 45 positions restent insolvables. » |
| 130–155 s | Coller Steakhouse USDT dans « Analyze » (en cache) ; section 4, encadré vert | « N'importe quel coffre V1. Ici, l'appel au Public Allocator est **exécuté** avant ma sortie : de 46,7 M à 50,5 M USDT récupérables. » Puis coller le coffre V2 : « Un coffre V2 est refusé, avec la raison. » |
| 155–180 s | Section 7 : registre des preuves ; section 8 : Replay | « Chaque chiffre est classé : mesuré on-chain, exécuté sur fork, borné, modélisé, hypothèse. Et tout se rejoue au wei, hors connexion. Le mécanisme de contagion est connu ; nous le rendons exécutable et chiffré pour votre position. » |

## Questions probables

| Question | Réponse (vérifiée par le code) |
|---|---|
| « Credora et DefiLlama font déjà ça ? » | Ils notent et décrivent le risque du coffre (PSL annualisée, perte si le collatéral baisse, exposition aux oracles). Nous ne prétendons pas l'inverse. Nous ajoutons la sortie exécutée selon l'ordre des départs (y compris entre coffres), le point mort face au coût de sortie mesuré, et le replay au wei. L'API Credora exige une liste blanche : rien d'intégré. |
| « Votre probabilité, d'où vient-elle ? » | Nous n'en avons pas. Nous montrons le point mort, la lecture risque-neutre du spread (rendement moins une référence sourcée : Sky Savings Rate lu on-chain, staking Lido mesuré sur 7 jours), et l'hypothèse de l'utilisateur. Aucune fréquence historique : pas de source datée avec échantillon. |
| « C'est juste `maxWithdraw` ? » | `maxWithdraw` donne l'état d'un coffre à un instant. Nous exécutons des séquences entre coffres : avant la sortie de Vault Bridge #1, `maxWithdraw` dit 5 209,91 ; après, 3 318,75. |
| « Et si un juge colle sa propre adresse ? » | Les plus gros coffres V1 par TVL sont pré-analysés (instantané, y compris hors connexion) ; un coffre jamais vu prend ~1 à 5 min en ligne ; V2, autre ERC-4626, jeton ou portefeuille → refus expliqué. |
| « Le Public Allocator rééquilibre » | 0 WETH réallouable vers Steakhouse ETH au bloc. Quand il y en a, nous l'exécutons (Steakhouse USDT : 46,7 M → 50,5 M sortables). |
| « Un âge de 10 h pour un feed, c'est une panne ? » | Non : cbBTC/USD s'est mis à jour au plus toutes les 24 h ou sur ~2 % de variation sur ses 24 derniers rounds (observé on-chain). |
| « Données réelles ? » | Contrats et état réels au bloc ; transactions simulées sur un fork local ; acteurs impersonés = scénario. |
| « Et Morpho V2 ? » | Refusé avec la raison : allocation par adaptateurs, `maxWithdraw` ne reflète pas la liquidité disponible. |

## À ne pas dire

« garanti », « prédiction », « audit », « certifié », « nouveau » à propos de la cartographie des dépendances ou des probabilités, « aucun outil ne fait ça », le nom auto-déclaré du contrat du plus gros détenteur, « fonctionne sur tous les coffres » (dire : « tout coffre MetaMorpho V1 »).
