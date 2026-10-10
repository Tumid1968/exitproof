window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8"]={
  "schema": "exitproof-refine/1",
  "vault": "0x9a8bC3B04b7f3D87cfC09ba407dCED575f2d61D8",
  "name": "MEV Capital wETH",
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
    "word": "Safe",
    "aloneFull": true,
    "aloneShare": 1,
    "worstShare": 0.9871,
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
    "timelockSeconds": 259200,
    "timelockDays": 3,
    "guardian": {
      "address": "0x777498D046d593F747Fd5884A73B3b9964479711",
      "kind": "Contract"
    },
    "source": "read on-chain during discovery (vault timelock(), guardian())"
  },
  "exitWindow": {
    "kind": "immediate",
    "share": 1
  },
  "vaultLevel": {
    "incident": "incident_feed_shock_plus_run",
    "ratio": 0.029575,
    "vaultLossAssets": "54924512198268074669",
    "basis": "executed on fork: holder value before minus after liquidations (bad debt socialised by Morpho Blue; net of lostAssets on MetaMorpho V1.1, where the share price does not drop)",
    "threshold": 0.01,
    "aboveThreshold": true
  },
  "concentration": {
    "byMarket": {
      "hhi": 0.996422,
      "word": "concentrated",
      "n": 3
    },
    "byCollateral": {
      "hhi": 0.999999,
      "word": "concentrated",
      "groups": [
        {
          "collateral": "wstETH",
          "share": 1
        },
        {
          "collateral": "WBTC",
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
        "queueIndex": 0,
        "collateral": "wstETH",
        "utilization": 0.8488,
        "aboveWatch": false
      },
      {
        "queueIndex": 3,
        "collateral": "wstETH",
        "utilization": 0.8359,
        "aboveWatch": false
      },
      {
        "queueIndex": 4,
        "collateral": "WBTC",
        "utilization": 0.7062,
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
          "wstETH"
        ],
        "exposure": "1857079976238335723770",
        "exposureShare": 0.999996,
        "shocks": [
          {
            "collateral": "wstETH",
            "label": "wstETH market price x0.9 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "42943902083944540896",
            "vaultLossRatio": 0.023124
          }
        ]
      },
      {
        "regime": "volatile",
        "shockSize": 0.4,
        "collaterals": [
          "WBTC"
        ],
        "exposure": "500942194798177",
        "exposureShare": 0,
        "shocks": [
          {
            "collateral": "WBTC",
            "label": "WBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "7676205787374",
            "vaultLossRatio": 0
          }
        ]
      }
    ]
  }
};
