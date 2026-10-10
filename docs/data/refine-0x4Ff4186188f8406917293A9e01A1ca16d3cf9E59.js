window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0x4Ff4186188f8406917293A9e01A1ca16d3cf9E59"]={
  "schema": "exitproof-refine/1",
  "vault": "0x4Ff4186188f8406917293A9e01A1ca16d3cf9E59",
  "name": "SwissBorg Morpho USDC",
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
    "word": "Easy exit",
    "aloneFull": true,
    "aloneShare": 1,
    "worstShare": 1,
    "worstRun": {
      "id": "alone",
      "otherPool": false,
      "others": 0
    },
    "level": "easy",
    "rule": "Easy exit: at least 90 % of the largest deposit gets out even in the worst executed case; Tight exit: 50–90 %; Hard exit: below 50 %, or not everything can get out even alone. It describes how easily you can leave, not whether you should. These limits are a choice."
  },
  "note": "Derived from results already executed or read (report, graph, history); no scenario re-executed, no existing number changed.",
  "history": null,
  "governance": {
    "timelockSeconds": 259200,
    "timelockDays": 3,
    "guardian": {
      "address": "0xAC15982Ca8A8e8BAc738FE492b84D8761B4384a3",
      "kind": "Safe 5/7 (owner)"
    },
    "source": "read on-chain during discovery (vault timelock(), guardian())"
  },
  "exitWindow": {
    "kind": "immediate",
    "share": 1
  },
  "vaultLevel": null,
  "concentration": {
    "byMarket": {
      "hhi": 0.345005,
      "word": "concentrated",
      "n": 4
    },
    "byCollateral": {
      "hhi": 0.345005,
      "word": "concentrated",
      "groups": [
        {
          "collateral": "none",
          "share": 0.049992
        },
        {
          "collateral": "WBTC",
          "share": 0.400004
        },
        {
          "collateral": "wstETH",
          "share": 0.150001
        },
        {
          "collateral": "cbBTC",
          "share": 0.400003
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
        "queueIndex": 1,
        "collateral": "WBTC",
        "utilization": 0.8864,
        "aboveWatch": false
      },
      {
        "queueIndex": 2,
        "collateral": "wstETH",
        "utilization": 0.9014,
        "aboveWatch": true
      },
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
          "WBTC",
          "wstETH",
          "cbBTC"
        ],
        "exposure": "8393184690413",
        "exposureShare": 0.950007,
        "shocks": [
          {
            "collateral": "WBTC",
            "label": "WBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "84244345065",
            "vaultLossRatio": 0.009535
          },
          {
            "collateral": "wstETH",
            "label": "wstETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "10666256732",
            "vaultLossRatio": 0.001207
          },
          {
            "collateral": "cbBTC",
            "label": "cbBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "27488255615",
            "vaultLossRatio": 0.003111
          }
        ]
      }
    ]
  }
};
