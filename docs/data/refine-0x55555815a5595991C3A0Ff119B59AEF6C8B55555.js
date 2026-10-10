window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0x55555815a5595991C3A0Ff119B59AEF6C8B55555"]={
  "schema": "exitproof-refine/1",
  "vault": "0x55555815a5595991C3A0Ff119B59AEF6C8B55555",
  "name": "Adpend USDC",
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
    "timelockSeconds": 1209600,
    "timelockDays": 14,
    "guardian": null,
    "source": "read on-chain during discovery (vault timelock(), guardian())"
  },
  "exitWindow": {
    "kind": "partial",
    "share": 0
  },
  "vaultLevel": null,
  "concentration": {
    "byMarket": {
      "hhi": 1,
      "word": "concentrated",
      "n": 3
    },
    "byCollateral": {
      "hhi": 1,
      "word": "concentrated",
      "groups": [
        {
          "collateral": "RLP",
          "share": 0
        },
        {
          "collateral": "sdeUSD",
          "share": 1
        },
        {
          "collateral": "sUSDe",
          "share": 0
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
        "queueIndex": 2,
        "collateral": "RLP",
        "utilization": 1,
        "aboveWatch": true
      },
      {
        "queueIndex": 17,
        "collateral": "sdeUSD",
        "utilization": 0.9999,
        "aboveWatch": true
      },
      {
        "queueIndex": 26,
        "collateral": "sUSDe",
        "utilization": 0.4088,
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
        "collaterals": [
          "sdeUSD",
          "sUSDe"
        ],
        "exposure": "491490837038961",
        "exposureShare": 0.996699,
        "shocks": [
          {
            "collateral": "sdeUSD",
            "label": "sdeUSD market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "0",
            "vaultLossRatio": 0
          },
          {
            "collateral": "sUSDe",
            "label": "sUSDe market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "0",
            "vaultLossRatio": 0
          }
        ]
      },
      {
        "regime": "volatile",
        "shockSize": 0.4,
        "collaterals": [
          "RLP"
        ],
        "exposure": "22",
        "exposureShare": 0,
        "shocks": [
          {
            "collateral": "RLP",
            "label": "RLP market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "21",
            "vaultHiddenLoss": "22",
            "vaultLossRatio": 0
          }
        ]
      }
    ]
  }
};
