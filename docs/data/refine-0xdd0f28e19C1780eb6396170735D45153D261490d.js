window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0xdd0f28e19C1780eb6396170735D45153D261490d"]={
  "schema": "exitproof-refine/1",
  "vault": "0xdd0f28e19C1780eb6396170735D45153D261490d",
  "name": "Gauntlet USDC Prime",
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
    "timelockSeconds": 604800,
    "timelockDays": 7,
    "guardian": {
      "address": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "kind": "Safe 3/6"
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
      "hhi": 0.304319,
      "word": "concentrated",
      "n": 7
    },
    "byCollateral": {
      "hhi": 0.312382,
      "word": "concentrated",
      "groups": [
        {
          "collateral": "cbBTC",
          "share": 0.416919
        },
        {
          "collateral": "WBTC",
          "share": 0.3151
        },
        {
          "collateral": "wstETH",
          "share": 0.092969
        },
        {
          "collateral": "WETH",
          "share": 0.175012
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
        "collateral": "wstETH",
        "utilization": 0.9014,
        "aboveWatch": true
      },
      {
        "queueIndex": 4,
        "collateral": "WBTC",
        "utilization": 0.9002,
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
        "collateral": "WETH",
        "utilization": 0.8799,
        "aboveWatch": false
      },
      {
        "queueIndex": 7,
        "collateral": "cbBTC",
        "utilization": 0.9042,
        "aboveWatch": true
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
          "wstETH",
          "WETH"
        ],
        "exposure": "22018516456785",
        "exposureShare": 0.999999,
        "shocks": [
          {
            "collateral": "cbBTC",
            "label": "cbBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "71445263344",
            "vaultLossRatio": 0.003244
          },
          {
            "collateral": "WBTC",
            "label": "WBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "158604639321",
            "vaultLossRatio": 0.007203
          },
          {
            "collateral": "wstETH",
            "label": "wstETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "160171637510",
            "vaultLossRatio": 0.007274
          },
          {
            "collateral": "WETH",
            "label": "WETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "13",
            "vaultHiddenLoss": "72796189060",
            "vaultLossRatio": 0.003306
          }
        ]
      }
    ]
  }
};
