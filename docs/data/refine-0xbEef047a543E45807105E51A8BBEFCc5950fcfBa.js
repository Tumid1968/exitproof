window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0xbEef047a543E45807105E51A8BBEFCc5950fcfBa"]={
  "schema": "exitproof-refine/1",
  "vault": "0xbEef047a543E45807105E51A8BBEFCc5950fcfBa",
  "name": "Steakhouse USDT",
  "assetSymbol": "USDT",
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
    "timelockSeconds": 604800,
    "timelockDays": 7,
    "guardian": {
      "address": "0xaeC761545Fd135db6d04D27C92BCB3951668c67F",
      "kind": "Contract"
    },
    "source": "read on-chain during discovery (vault timelock(), guardian())"
  },
  "exitWindow": {
    "kind": "partial",
    "share": 0.8434
  },
  "vaultLevel": {
    "incident": "incident_feed_dexlimited_plus_run",
    "ratio": 0.00032,
    "vaultLossAssets": "26279954385",
    "basis": "executed on fork (bad debt of the liquidations the AMM depth allows) + analytic unrecognised shortfall of the positions left insolvent",
    "threshold": 0.01,
    "aboveThreshold": false
  },
  "concentration": {
    "byMarket": {
      "hhi": 0.267897,
      "word": "concentrated",
      "n": 9
    },
    "byCollateral": {
      "hhi": 0.316279,
      "word": "concentrated",
      "groups": [
        {
          "collateral": "wstETH",
          "share": 0.432846
        },
        {
          "collateral": "WBTC",
          "share": 0.329702
        },
        {
          "collateral": "cbBTC",
          "share": 0.122552
        },
        {
          "collateral": "sUSDS",
          "share": 0.039691
        },
        {
          "collateral": "weETH",
          "share": 0.057579
        },
        {
          "collateral": "XAUt",
          "share": 0.01763
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
        "collateral": "wstETH",
        "utilization": 0.8026,
        "aboveWatch": false
      },
      {
        "queueIndex": 2,
        "collateral": "WBTC",
        "utilization": 0.8019,
        "aboveWatch": false
      },
      {
        "queueIndex": 3,
        "collateral": "cbBTC",
        "utilization": 0.8152,
        "aboveWatch": false
      },
      {
        "queueIndex": 4,
        "collateral": "sUSDS",
        "utilization": 0.8047,
        "aboveWatch": false
      },
      {
        "queueIndex": 5,
        "collateral": "WBTC",
        "utilization": 0.7975,
        "aboveWatch": false
      },
      {
        "queueIndex": 6,
        "collateral": "weETH",
        "utilization": 0.7835,
        "aboveWatch": false
      },
      {
        "queueIndex": 7,
        "collateral": "wstETH",
        "utilization": 0.7989,
        "aboveWatch": false
      },
      {
        "queueIndex": 8,
        "collateral": "XAUt",
        "utilization": 0.8267,
        "aboveWatch": false
      },
      {
        "queueIndex": 9,
        "collateral": "cbBTC",
        "utilization": 0.8842,
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
          "sUSDS"
        ],
        "exposure": "3251107879551",
        "exposureShare": 0.03969,
        "shocks": [
          {
            "collateral": "sUSDS",
            "label": "sUSDS market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "26283249963",
            "vaultLossRatio": 0.00032
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
          "XAUt"
        ],
        "exposure": "78659329096055",
        "exposureShare": 0.960306,
        "shocks": [
          {
            "collateral": "wstETH",
            "label": "wstETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "189151955713",
            "vaultLossRatio": 0.002309
          },
          {
            "collateral": "WBTC",
            "label": "WBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "1686136190114",
            "vaultLossRatio": 0.020585
          },
          {
            "collateral": "cbBTC",
            "label": "cbBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "222014149072",
            "vaultLossRatio": 0.00271
          },
          {
            "collateral": "weETH",
            "label": "weETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "0",
            "vaultLossRatio": 0
          },
          {
            "collateral": "XAUt",
            "label": "XAUt market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "40598533458",
            "vaultLossRatio": 0.000495
          }
        ]
      }
    ]
  }
};
