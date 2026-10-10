window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB"]={
  "schema": "exitproof-refine/1",
  "vault": "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
  "name": "Steakhouse USDC",
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
    "word": "Safe",
    "aloneFull": true,
    "aloneShare": 1,
    "worstShare": 0.9499,
    "worstRun": {
      "id": "all_first",
      "otherPool": true,
      "others": 6
    },
    "rule": "Safe: at least 90 % comes out even in the worst executed case; Careful: 50–90 %; Risky: below 50 %, or not everything can come out even alone. These limits are a choice, for the largest deposit in the pool."
  },
  "note": "Derived from results already executed or read (report, graph, history); no scenario re-executed, no existing number changed.",
  "history": null,
  "governance": {
    "timelockSeconds": 604800,
    "timelockDays": 7,
    "guardian": {
      "address": "0xaa0500198B4425DfC4E272FbE42C8E64E21fc03d",
      "kind": "Contract"
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
      "hhi": 0.226091,
      "word": "moderately concentrated",
      "n": 11
    },
    "byCollateral": {
      "hhi": 0.229469,
      "word": "moderately concentrated",
      "groups": [
        {
          "collateral": "cbBTC",
          "share": 0.329872
        },
        {
          "collateral": "WBTC",
          "share": 0.209511
        },
        {
          "collateral": "weETH",
          "share": 0.194371
        },
        {
          "collateral": "wstETH",
          "share": 0.073075
        },
        {
          "collateral": "steakEURCV",
          "share": 0.183133
        },
        {
          "collateral": "WETH",
          "share": 0.010037
        },
        {
          "collateral": "FLHYon",
          "share": 0.000001
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
        "collateral": "cbBTC",
        "utilization": 0.895,
        "aboveWatch": false
      },
      {
        "queueIndex": 2,
        "collateral": "WBTC",
        "utilization": 0.8864,
        "aboveWatch": false
      },
      {
        "queueIndex": 3,
        "collateral": "weETH",
        "utilization": 0.897,
        "aboveWatch": false
      },
      {
        "queueIndex": 4,
        "collateral": "wstETH",
        "utilization": 0.9014,
        "aboveWatch": true
      },
      {
        "queueIndex": 5,
        "collateral": "wstETH",
        "utilization": 0.9,
        "aboveWatch": true
      },
      {
        "queueIndex": 6,
        "collateral": "steakEURCV",
        "utilization": 0.897,
        "aboveWatch": false
      },
      {
        "queueIndex": 7,
        "collateral": "WETH",
        "utilization": 0.8799,
        "aboveWatch": false
      },
      {
        "queueIndex": 8,
        "collateral": "WBTC",
        "utilization": 0.9002,
        "aboveWatch": true
      },
      {
        "queueIndex": 9,
        "collateral": "weETH",
        "utilization": 0.9059,
        "aboveWatch": true
      },
      {
        "queueIndex": 10,
        "collateral": "cbBTC",
        "utilization": 0.9042,
        "aboveWatch": true
      },
      {
        "queueIndex": 11,
        "collateral": "FLHYon",
        "utilization": 0.8985,
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
          "cbBTC",
          "WBTC",
          "weETH",
          "wstETH",
          "steakEURCV",
          "WETH",
          "FLHYon"
        ],
        "exposure": "65097684288882",
        "exposureShare": 0.999999,
        "shocks": [
          {
            "collateral": "cbBTC",
            "label": "cbBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "167065325665",
            "vaultLossRatio": 0.002566
          },
          {
            "collateral": "WBTC",
            "label": "WBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "321546702784",
            "vaultLossRatio": 0.004939
          },
          {
            "collateral": "weETH",
            "label": "weETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "1524808785425",
            "vaultLossRatio": 0.023423
          },
          {
            "collateral": "wstETH",
            "label": "wstETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "132411377260",
            "vaultLossRatio": 0.002034
          },
          {
            "collateral": "steakEURCV",
            "label": "steakEURCV market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "2773310107463",
            "vaultLossRatio": 0.042602
          },
          {
            "collateral": "WETH",
            "label": "WETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "2",
            "vaultHiddenLoss": "12343243504",
            "vaultLossRatio": 0.000189
          },
          {
            "collateral": "FLHYon",
            "label": "FLHYon market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "0",
            "vaultLossRatio": 0
          }
        ]
      }
    ]
  }
};
