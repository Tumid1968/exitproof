window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0x78B18E07dc43017fcEaabaD0751d6464c0F56b25"]={
  "schema": "exitproof-refine/1",
  "vault": "0x78B18E07dc43017fcEaabaD0751d6464c0F56b25",
  "name": "Metronome msETH Vault",
  "assetSymbol": "msETH",
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
    "guardian": {
      "address": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "kind": "Safe 3/6"
    },
    "source": "read on-chain during discovery (vault timelock(), guardian())"
  },
  "exitWindow": {
    "kind": "partial",
    "share": 0.3173
  },
  "vaultLevel": {
    "incident": "incident_feed_dexlimited_plus_run",
    "ratio": 0.004701,
    "vaultLossAssets": "9626179980534740456",
    "basis": "executed on fork (bad debt of the liquidations the AMM depth allows) + analytic unrecognised shortfall of the positions left insolvent",
    "threshold": 0.01,
    "aboveThreshold": false
  },
  "concentration": {
    "byMarket": {
      "hhi": 0.41028,
      "word": "concentrated",
      "n": 4
    },
    "byCollateral": {
      "hhi": 0.41028,
      "word": "concentrated",
      "groups": [
        {
          "collateral": "none",
          "share": 0.253621
        },
        {
          "collateral": "ynETHx",
          "share": 0.556802
        },
        {
          "collateral": "rswETH",
          "share": 0.189548
        },
        {
          "collateral": "weETH",
          "share": 0.00003
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
        "collateral": "ynETHx",
        "utilization": 0.9195,
        "aboveWatch": true
      },
      {
        "queueIndex": 2,
        "collateral": "rswETH",
        "utilization": 0.9,
        "aboveWatch": true
      },
      {
        "queueIndex": 3,
        "collateral": "weETH",
        "utilization": 0.3331,
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
          "ynETHx",
          "rswETH",
          "weETH"
        ],
        "exposure": "1526570567865922748771",
        "exposureShare": 0.745526,
        "shocks": [
          {
            "collateral": "ynETHx",
            "label": "ynETHx market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "10097976941638799103",
            "vaultLossRatio": 0.004931
          },
          {
            "collateral": "rswETH",
            "label": "rswETH market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "9620555179430415049",
            "vaultLossRatio": 0.004698
          },
          {
            "collateral": "weETH",
            "label": "weETH market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "101606962293512",
            "vaultLossRatio": 0
          }
        ]
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
