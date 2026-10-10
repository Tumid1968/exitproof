window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0x974c8FBf4fd795F66B85B73ebC988A51F1A040a9"]={
  "schema": "exitproof-refine/1",
  "vault": "0x974c8FBf4fd795F66B85B73ebC988A51F1A040a9",
  "name": "Hakutora USDC",
  "assetSymbol": "USDC",
  "source": {
    "chainId": 1,
    "block": "26157638",
    "blockHash": "0x3e8450286456e913f08f2290aa3eac5e0c8b6d5be51bef3955032d9c43977bf4",
    "timestamp": "1791582443",
    "baseFeePerGas": "121537943",
    "forkLocalChainId": 31337
  },
  "note": "Derived from results already executed or read (report, graph, history); no scenario re-executed, no existing number changed.",
  "history": null,
  "governance": {
    "timelockSeconds": 259200,
    "timelockDays": 3,
    "guardian": null,
    "source": "read on-chain during discovery (vault timelock(), guardian())"
  },
  "exitWindow": {
    "kind": "immediate",
    "share": 1
  },
  "vaultLevel": null,
  "concentration": {
    "byMarket": {
      "hhi": 1,
      "word": "concentrated",
      "n": 1
    },
    "byCollateral": {
      "hhi": 1,
      "word": "concentrated",
      "groups": [
        {
          "collateral": "cbBTC",
          "share": 1
        }
      ]
    },
    "thresholds": "HHI ≥ 0.25 concentrated, 0.15–0.25 moderately concentrated, < 0.15 diversified (US DOJ/FTC 2010 guidelines); weights = vault supply per market, idle market (no collateral) included"
  },
  "utilization": {
    "watchLevel": 0.9,
    "watchSource": "Gauntlet VaultBook (90 % utilization watch level; the 48-hour duration is not measured here)",
    "markets": [
      {
        "queueIndex": 3,
        "collateral": "cbBTC",
        "utilization": 0.895,
        "aboveWatch": false
      }
    ]
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
        "collaterals": [
          "cbBTC"
        ],
        "exposure": "15831612964826",
        "exposureShare": 0.999999,
        "shocks": [
          {
            "collateral": "cbBTC",
            "label": "cbBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "123143042443",
            "vaultLossRatio": 0.007778
          }
        ]
      }
    ]
  }
};
