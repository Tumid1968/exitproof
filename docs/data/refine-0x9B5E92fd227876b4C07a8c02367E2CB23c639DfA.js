window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0x9B5E92fd227876b4C07a8c02367E2CB23c639DfA"]={
  "schema": "exitproof-refine/1",
  "vault": "0x9B5E92fd227876b4C07a8c02367E2CB23c639DfA",
  "name": "Clearstar Yield USDC",
  "assetSymbol": "USDC",
  "source": {
    "chainId": 1,
    "block": "26157638",
    "blockHash": "0x3e8450286456e913f08f2290aa3eac5e0c8b6d5be51bef3955032d9c43977bf4",
    "timestamp": "1791582443",
    "baseFeePerGas": "121537943",
    "forkLocalChainId": 31337
  },
  "answer": {
    "word": "Hard exit",
    "aloneFull": false,
    "aloneShare": 0,
    "worstShare": 0,
    "worstRun": {
      "id": "alone",
      "otherPool": false,
      "others": 0
    },
    "level": "hard",
    "rule": "Easy exit: at least 90 % of the largest deposit gets out even in the worst executed case; Tight exit: 50–90 %; Hard exit: below 50 %, or not everything can get out even alone. It describes how easily you can leave, not whether you should. These limits are a choice."
  },
  "note": "Derived from results already executed or read (report, graph, history); no scenario re-executed, no existing number changed.",
  "history": null,
  "governance": {
    "timelockSeconds": 259200,
    "timelockDays": 3,
    "guardian": {
      "address": "0x1bB2D4532FbEDC2a93B77248D023657014C18458",
      "kind": "Safe 2/4"
    },
    "source": "read on-chain during discovery (vault timelock(), guardian())"
  },
  "exitWindow": {
    "kind": "partial",
    "share": 0
  },
  "vaultLevel": null,
  "concentration": {
    "byMarket": {
      "hhi": 0,
      "word": "diversified",
      "n": 0
    },
    "byCollateral": {
      "hhi": 0,
      "word": "diversified",
      "groups": []
    },
    "thresholds": "HHI ≥ 0.25 concentrated, 0.15–0.25 moderately concentrated, < 0.15 diversified (US DOJ/FTC 2010 guidelines); weights = vault supply per market, idle market (no collateral) included"
  },
  "utilization": {
    "watchLevel": 0.9,
    "watchSource": "Gauntlet VaultBook (90 % utilization watch level; the 48-hour duration is not measured here)",
    "markets": []
  },
  "regimes": {
    "definition": "pegged: collateral of the same family as the loan asset (ETH, USD, BTC, EUR by symbol), −10 %; volatile: otherwise, −40 %",
    "factors": {
      "pegged": 0.9,
      "volatile": 0.6
    },
    "byRegime": [
      {
        "regime": "pegged",
        "shockSize": 0.1,
        "collaterals": [],
        "exposure": "0",
        "exposureShare": 0,
        "shocks": []
      },
      {
        "regime": "volatile",
        "shockSize": 0.4,
        "collaterals": [],
        "exposure": "0",
        "exposureShare": 0,
        "shocks": []
      }
    ]
  }
};
