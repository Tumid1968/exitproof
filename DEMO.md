# Démo ExitProof

**Exit tool for Morpho vaults: what do I really get back, and from what probability does leaving pay off.**

Un seul protocole : MetaMorpho V1 sur Morpho Blue. Tous les chiffres sont produits par ce dépôt (replays verts). Bloc figé 26 157 638 (9 oct. 2026, 21:47 UTC).

## Avant de monter sur scène (5 min avant)

```bash
npm run demo                 # ou : npm run demo -- --offline   (Wi-Fi douteux ; tout est en cache)
```

- Vérifier `http://127.0.0.1:5173/#/status` : tout en vert, fork au bloc 26 157 638.
- Cliquer une fois « Execute again on the fork » dans la section 1 (chauffe le fork, < 1 s ensuite).
- **Plan B sans rien** : `docs/index.html` en double-clic (mêmes écrans, résultats rejoués depuis les manifestes).
- Si le fork tombe : l'interface bascule seule en replay statique ; le superviseur relance le fork en ~3 s.

## Script 90 secondes

| Temps | À l'écran | À dire |
|---|---|---|
| 0–30 s | Section 1. Cliquer « Vault Bridge WETH #1 exits its own vault », puis « Execute again on the fork » | « Je détiens 5 210 WETH dans un coffre Morpho. Qu'est-ce que je récupère vraiment ? Seul : 5 209,91. Si un déposant d'un **autre** coffre, sans aucune part du mien, sort avant moi : ma sortie complète échoue — NotEnoughLiquidity — et je ne récupère que 3 318,75, −36,30 %. Exécuté à l'instant, identique au wei. » |
| 30–45 s | Lignes « holder #2 exits » puis « holder #2 exits Gauntlet WETH Prime → this vault » ; phrase du coussin | « Le n°2 de mon coffre sort d'abord : −19,18 %. S'il sort de ses deux coffres : −60,09 %. Coussin : tant que moins de 1 736,99 WETH sortent avant moi, rien ne change. » |
| 45–70 s | Phrase du haut ; section 2, les deux tuiles p* | « À partir de quelle probabilité faut-il partir ? Si un décrochage du stETH, que l'oracle ne voit pas, vous semble plus probable que 1,13 % sur 30 jours — ou 5,57 % si être bloqué ne vous coûte rien — partir paie. Les deux sont affichés : l'écart est une hypothèse. La probabilité, c'est la vôtre. » |
| 70–80 s | Section « Not modeled » | « Hack, attaque de gouvernance, faille d'oracle : nous ne les modélisons pas. Pour une perte totale, même calcul : au-dessus de 0,13 % sur 30 jours, partir paie. » |
| 80–90 s | Onglet Replay (ou phrase) | « Pourquoi ? Les marchés sont partagés entre coffres et l'oracle suit un taux de change. Chaque chiffre se rejoue au wei, même sans Internet. » |

## Script 3 minutes

| Temps | À l'écran | À dire |
|---|---|---|
| 0–50 s | Section 1, les 6 lignes ; exécuter en direct « Vault Bridge » puis « holder #2 » | Seul 5 209,91 ; n°3/n°4 sans effet ; n°2 4 210,68 (−19,18 %) ; n°2 puis n°3 3 489,01 ; autre coffre 3 318,75 (−36,30 %) ; n°2 sur ses deux coffres 2 079,21 (−60,09 %). Coussin 1 736,99 WETH. « Une note de risque décrit le coffre ; ici, c'est votre sortie, exécutée, selon l'ordre des départs. » |
| 50–100 s | Phrase du haut ; ligne mesuré / modélisé / hypothèse ; section 2 : horizon 7/30/90 j, les deux p*, tableau de décomposition | « Ce qui est mesuré : la liquidité de sortie. Ce qui est modélisé, borne basse : la perte. Ce qui est votre hypothèse : la probabilité. Coût de sortie : 6,54 WETH de rendement abandonné sur 30 jours. Perte d'incident : 117,41 WETH modélisés, plus 4 627 WETH bloqués, que vous valorisez à 10 % ou à 0 % : point mort 1,13 % ou 5,57 %. Le spread ne dit rien ici : le coffre rapporte moins que le staking ETH. » |
| 100–125 s | Curseur « Your probability » | « Le curseur ne donne aucun verdict tant que vous ne l'avez pas bougé. À 3 % : partir paie seulement si être bloqué vous coûte 10 %. » |
| 125–145 s | Section « Not modeled » | « Hack de contrat, attaque de gouvernance, faille d'oracle : pas modélisables on-chain. Pour une perte totale, avec la même fonction : 0,03 % sur 7 jours, 0,13 % sur 30, 0,38 % sur 90. » |
| 145–165 s | Onglet Dependencies : le nœud oracle, les coffres pairs | « Le pourquoi, en une minute : les deux marchés wstETH sont pricés par le seul taux de change, et huit autres coffres prêtent dans les mêmes marchés. Le Public Allocator n'apporte rien : 0 WETH réallouable. » |
| 165–180 s | Onglet Replay ; mentionner `docs/index.html` | « Chaque chiffre est rejoué au wei, hors connexion. Et le jury peut tout ouvrir sans nous : double-clic sur docs/index.html. » |

## Questions probables

| Question | Réponse (vérifiée par le code) |
|---|---|
| « Credora et DefiLlama font déjà ça ? » | Ils notent et décrivent le risque du coffre (PSL annualisée, perte si le collatéral baisse, exposition aux oracles). Nous ne prétendons pas l'inverse. Nous répondons à une autre question : ce que je récupère, exécuté selon l'ordre des départs, et à partir de quelle probabilité partir paie. L'API Credora exige une liste blanche : rien d'intégré. |
| « Et les hacks, la gouvernance ? » | Non modélisés, et dit à l'écran. Pour une perte totale, le point mort est calculé par la même fonction : 0,13 % sur 30 jours pour cette position. |
| « Votre probabilité, d'où vient-elle ? » | Nous n'en avons pas : le point mort, la lecture risque-neutre du spread (non évaluée ici, spread négatif), et la vôtre. |
| « Pourquoi 1,13 % et pas 5,57 % ? » | Les deux sont affichés au même niveau : 463 des 580 WETH de perte viennent du coût attribué aux fonds bloqués. |
| « C'est juste `maxWithdraw` ? » | `maxWithdraw` donne l'état d'un coffre à un instant. Nous exécutons des séquences entre coffres : avant la sortie de Vault Bridge #1, il dit 5 209,91 ; après, 3 318,75. |
| « Même montant 5 209,914854809315636083 dans plusieurs manifestes ? » | La même transaction (le plus gros détenteur de Steakhouse ETH qui sort en premier, k = 1, même état) : moteur déterministe. |
| « Et si votre démo plante ? » | Superviseur qui relance (testé), repli automatique en replay statique, `docs/index.html` sans rien installer. |

## À ne pas dire

« garanti », « prédiction », « audit », « certifié », « nouveau » à propos de la cartographie des dépendances ou des probabilités, « aucun outil ne fait ça », le nom auto-déclaré du contrat du plus gros détenteur, « fonctionne sur tous les coffres » (dire : « tout coffre MetaMorpho V1 »).
