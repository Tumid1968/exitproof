window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0x68Aea7b82Df6CcdF76235D46445Ed83f85F845A3"]={
  "schema": "exitproof-refine/1",
  "vault": "0x68Aea7b82Df6CcdF76235D46445Ed83f85F845A3",
  "name": "Yearn USDC",
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
    "worstShare": 1,
    "worstRun": {
      "id": "alone",
      "otherPool": false,
      "others": 0
    },
    "rule": "Safe: at least 90 % comes out even in the worst executed case; Careful: 50–90 %; Risky: below 50 %, or not everything can come out even alone. These limits are a choice, for the largest deposit in the pool."
  },
  "note": "Derived from results already executed or read (report, graph, history); no scenario re-executed, no existing number changed.",
  "history": null,
  "governance": {
    "timelockSeconds": 259200,
    "timelockDays": 3,
    "guardian": {
      "address": "0xFEB4acf3df3cDEA7399794D0869ef76A6EfAff52",
      "kind": "Safe 6/9"
    },
    "source": "read on-chain during discovery (vault timelock(), guardian())"
  },
  "exitWindow": {
    "kind": "immediate",
    "share": 1
  },
  "vaultLevel": {
    "incident": "incident_feed_shock_plus_run",
    "ratio": 0,
    "vaultLossAssets": "3002152",
    "basis": "executed on fork: holder value before minus after liquidations (bad debt socialised by Morpho Blue; net of lostAssets on MetaMorpho V1.1, where the share price does not drop)",
    "threshold": 0.01,
    "aboveThreshold": false
  },
  "concentration": {
    "byMarket": {
      "hhi": 0.519284,
      "word": "concentrated",
      "n": 5
    },
    "byCollateral": {
      "hhi": 0.519821,
      "word": "concentrated",
      "groups": [
        {
          "collateral": "cbBTC",
          "share": 0.65747
        },
        {
          "collateral": "wstETH",
          "share": 0.051077
        },
        {
          "collateral": "WBTC",
          "share": 0.291453
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
        "collateral": "cbBTC",
        "utilization": 0.895,
        "aboveWatch": false
      },
      {
        "queueIndex": 1,
        "collateral": "wstETH",
        "utilization": 0.9014,
        "aboveWatch": true
      },
      {
        "queueIndex": 2,
        "collateral": "cbBTC",
        "utilization": 0.9024,
        "aboveWatch": true
      },
      {
        "queueIndex": 3,
        "collateral": "wstETH",
        "utilization": 0.9004,
        "aboveWatch": true
      },
      {
        "queueIndex": 5,
        "collateral": "WBTC",
        "utilization": 0.8864,
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
          "wstETH",
          "WBTC"
        ],
        "exposure": "6169961232958",
        "exposureShare": 0.999999,
        "shocks": [
          {
            "collateral": "cbBTC",
            "label": "cbBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "31535691307",
            "vaultLossRatio": 0.005111
          },
          {
            "collateral": "wstETH",
            "label": "wstETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "2513059512",
            "vaultLossRatio": 0.000407
          },
          {
            "collateral": "WBTC",
            "label": "WBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "42867445793",
            "vaultLossRatio": 0.006947
          }
        ]
      }
    ]
  }
};
