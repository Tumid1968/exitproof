window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0xA0804346780b4c2e3bE118ac957D1DB82F9d7484"]={
  "schema": "exitproof-refine/1",
  "vault": "0xA0804346780b4c2e3bE118ac957D1DB82F9d7484",
  "name": "Smokehouse USDT",
  "assetSymbol": "USDT",
  "source": {
    "chainId": 1,
    "block": "26157638",
    "blockHash": "0x3e8450286456e913f08f2290aa3eac5e0c8b6d5be51bef3955032d9c43977bf4",
    "timestamp": "1791582443",
    "baseFeePerGas": "121537943",
    "forkLocalChainId": 31337
  },
  "answer": {
    "word": "Risky",
    "aloneFull": false,
    "aloneShare": 0.709,
    "worstShare": 0.6054,
    "worstRun": {
      "id": "top_holders_first",
      "otherPool": false,
      "others": 3
    },
    "rule": "Safe: at least 90 % comes out even in the worst executed case; Careful: 50–90 %; Risky: below 50 %, or not everything can come out even alone. These limits are a choice, for the largest deposit in the pool."
  },
  "note": "Derived from results already executed or read (report, graph, history); no scenario re-executed, no existing number changed.",
  "history": null,
  "governance": {
    "timelockSeconds": 259200,
    "timelockDays": 3,
    "guardian": {
      "address": "0x4fCD92bF530abdEb5Eb7413A63a8EB8F5a62C1dD",
      "kind": "Contract"
    },
    "source": "read on-chain during discovery (vault timelock(), guardian())"
  },
  "exitWindow": {
    "kind": "partial",
    "share": 0.709
  },
  "vaultLevel": {
    "incident": "incident_feed_dexlimited_plus_run",
    "ratio": 0.000055,
    "vaultLossAssets": "1193417931",
    "basis": "executed on fork (bad debt of the liquidations the AMM depth allows) + analytic unrecognised shortfall of the positions left insolvent",
    "threshold": 0.01,
    "aboveThreshold": false
  },
  "concentration": {
    "byMarket": {
      "hhi": 0.143825,
      "word": "diversified",
      "n": 14
    },
    "byCollateral": {
      "hhi": 0.15703,
      "word": "moderately concentrated",
      "groups": [
        {
          "collateral": "wstETH",
          "share": 0.120408
        },
        {
          "collateral": "WBTC",
          "share": 0.122745
        },
        {
          "collateral": "cbBTC",
          "share": 0.191927
        },
        {
          "collateral": "sUSDS",
          "share": 0.013788
        },
        {
          "collateral": "PT-reUSD-10DEC2026",
          "share": 0.2
        },
        {
          "collateral": "PT-sUSDS-26NOV2026",
          "share": 0.196904
        },
        {
          "collateral": "weETH",
          "share": 0.095839
        },
        {
          "collateral": "reUSD",
          "share": 0.049399
        },
        {
          "collateral": "WETH",
          "share": 0.00343
        },
        {
          "collateral": "sUSDe",
          "share": 0.005561
        },
        {
          "collateral": "PT-USDG-24SEP2026",
          "share": 0
        },
        {
          "collateral": "FLHYon",
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
        "queueIndex": 4,
        "collateral": "wstETH",
        "utilization": 0.8026,
        "aboveWatch": false
      },
      {
        "queueIndex": 5,
        "collateral": "WBTC",
        "utilization": 0.8019,
        "aboveWatch": false
      },
      {
        "queueIndex": 6,
        "collateral": "cbBTC",
        "utilization": 0.8152,
        "aboveWatch": false
      },
      {
        "queueIndex": 7,
        "collateral": "sUSDS",
        "utilization": 0.8047,
        "aboveWatch": false
      },
      {
        "queueIndex": 8,
        "collateral": "PT-reUSD-10DEC2026",
        "utilization": 0.7954,
        "aboveWatch": false
      },
      {
        "queueIndex": 9,
        "collateral": "WBTC",
        "utilization": 0.7975,
        "aboveWatch": false
      },
      {
        "queueIndex": 10,
        "collateral": "PT-sUSDS-26NOV2026",
        "utilization": 0.8342,
        "aboveWatch": false
      },
      {
        "queueIndex": 11,
        "collateral": "wstETH",
        "utilization": 0.7989,
        "aboveWatch": false
      },
      {
        "queueIndex": 12,
        "collateral": "weETH",
        "utilization": 0.8052,
        "aboveWatch": false
      },
      {
        "queueIndex": 13,
        "collateral": "reUSD",
        "utilization": 0.705,
        "aboveWatch": false
      },
      {
        "queueIndex": 14,
        "collateral": "WETH",
        "utilization": 0.8086,
        "aboveWatch": false
      },
      {
        "queueIndex": 15,
        "collateral": "sUSDe",
        "utilization": 0.8059,
        "aboveWatch": false
      },
      {
        "queueIndex": 18,
        "collateral": "PT-USDG-24SEP2026",
        "utilization": 0.795,
        "aboveWatch": false
      },
      {
        "queueIndex": 21,
        "collateral": "FLHYon",
        "utilization": 0.8616,
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
          "sUSDS",
          "PT-reUSD-10DEC2026",
          "PT-sUSDS-26NOV2026",
          "reUSD",
          "sUSDe",
          "PT-USDG-24SEP2026"
        ],
        "exposure": "10074354434842",
        "exposureShare": 0.46565,
        "shocks": [
          {
            "collateral": "sUSDS",
            "label": "sUSDS market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "2411656814",
            "vaultLossRatio": 0.000111
          },
          {
            "collateral": "PT-reUSD-10DEC2026",
            "label": "PT-reUSD-10DEC2026 market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "0",
            "vaultLossRatio": 0
          },
          {
            "collateral": "PT-sUSDS-26NOV2026",
            "label": "PT-sUSDS-26NOV2026 market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "0",
            "vaultLossRatio": 0
          },
          {
            "collateral": "reUSD",
            "label": "reUSD market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "1145217851",
            "vaultLossRatio": 0.000052
          },
          {
            "collateral": "sUSDe",
            "label": "sUSDe market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "677396179",
            "vaultLossRatio": 0.000031
          },
          {
            "collateral": "PT-USDG-24SEP2026",
            "label": "PT-USDG-24SEP2026 market price x0.9 (oracle unchanged: economic shortfall)",
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
          "wstETH",
          "WBTC",
          "cbBTC",
          "weETH",
          "WETH",
          "FLHYon"
        ],
        "exposure": "11560587308993",
        "exposureShare": 0.534346,
        "shocks": [
          {
            "collateral": "wstETH",
            "label": "wstETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "18286224834",
            "vaultLossRatio": 0.000845
          },
          {
            "collateral": "WBTC",
            "label": "WBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "199666469858",
            "vaultLossRatio": 0.009228
          },
          {
            "collateral": "cbBTC",
            "label": "cbBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "92005653465",
            "vaultLossRatio": 0.004252
          },
          {
            "collateral": "weETH",
            "label": "weETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "246543337183",
            "vaultLossRatio": 0.011395
          },
          {
            "collateral": "WETH",
            "label": "WETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "20655495",
            "vaultLossRatio": 0
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
