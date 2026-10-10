window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0x31A5684983EeE865d943A696AAC155363bA024f9"]={
  "schema": "exitproof-refine/1",
  "vault": "0x31A5684983EeE865d943A696AAC155363bA024f9",
  "name": "Vault Bridge WETH",
  "assetSymbol": "WETH",
  "source": {
    "chainId": 1,
    "block": "26157638",
    "blockHash": "0x3e8450286456e913f08f2290aa3eac5e0c8b6d5be51bef3955032d9c43977bf4",
    "timestamp": "1791582443",
    "baseFeePerGas": "121537943",
    "forkLocalChainId": 31337
  },
  "answer": {
    "word": "Tight exit",
    "aloneFull": true,
    "aloneShare": 1,
    "worstShare": 0.6113,
    "worstRun": {
      "id": "all_first",
      "otherPool": true,
      "others": 6
    },
    "level": "tight",
    "rule": "Easy exit: at least 90 % of the largest deposit gets out even in the worst executed case; Tight exit: 50–90 %; Hard exit: below 50 %, or not everything can get out even alone. It describes how easily you can leave, not whether you should. These limits are a choice."
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
    "kind": "immediate",
    "share": 1
  },
  "vaultLevel": {
    "incident": "incident_feed_shock_plus_run",
    "ratio": 0.021766,
    "vaultLossAssets": "143745798458376420550",
    "basis": "executed on fork: holder value before minus after liquidations (bad debt socialised by Morpho Blue; net of lostAssets on MetaMorpho V1.1, where the share price does not drop)",
    "threshold": 0.01,
    "aboveThreshold": true
  },
  "concentration": {
    "byMarket": {
      "hhi": 0.577305,
      "word": "concentrated",
      "n": 5
    },
    "byCollateral": {
      "hhi": 0.577305,
      "word": "concentrated",
      "groups": [
        {
          "collateral": "wstETH",
          "share": 0.73577
        },
        {
          "collateral": "WBTC",
          "share": 0.000105
        },
        {
          "collateral": "cbBTC",
          "share": 0.000373
        },
        {
          "collateral": "weETH",
          "share": 0.156008
        },
        {
          "collateral": "none",
          "share": 0.107744
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
        "queueIndex": 0,
        "collateral": "wstETH",
        "utilization": 0.8359,
        "aboveWatch": false
      },
      {
        "queueIndex": 1,
        "collateral": "WBTC",
        "utilization": 0.7062,
        "aboveWatch": false
      },
      {
        "queueIndex": 2,
        "collateral": "cbBTC",
        "utilization": 0.3057,
        "aboveWatch": false
      },
      {
        "queueIndex": 3,
        "collateral": "weETH",
        "utilization": 0.8297,
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
          "wstETH",
          "weETH"
        ],
        "exposure": "5889310567655247189578",
        "exposureShare": 0.891775,
        "shocks": [
          {
            "collateral": "wstETH",
            "label": "wstETH market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "112389046232019788794",
            "vaultLossRatio": 0.017018
          },
          {
            "collateral": "weETH",
            "label": "weETH market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "17644939954447098762",
            "vaultLossRatio": 0.002671
          }
        ]
      },
      {
        "regime": "volatile",
        "shockSize": 0.4,
        "collaterals": [
          "WBTC",
          "cbBTC"
        ],
        "exposure": "3156129077728688378",
        "exposureShare": 0.000477,
        "shocks": [
          {
            "collateral": "WBTC",
            "label": "WBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "10661370908556440",
            "vaultLossRatio": 0.000001
          },
          {
            "collateral": "cbBTC",
            "label": "cbBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "58075639944999230",
            "vaultLossRatio": 0.000008
          }
        ]
      }
    ]
  }
};
