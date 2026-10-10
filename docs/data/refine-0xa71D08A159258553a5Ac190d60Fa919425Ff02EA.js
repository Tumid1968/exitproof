window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["refine:0xa71D08A159258553a5Ac190d60Fa919425Ff02EA"]={
  "schema": "exitproof-refine/1",
  "vault": "0xa71D08A159258553a5Ac190d60Fa919425Ff02EA",
  "name": "Hakutora USDT",
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
    "guardian": null,
    "source": "read on-chain during discovery (vault timelock(), guardian())"
  },
  "exitWindow": {
    "kind": "immediate",
    "share": 1
  },
  "vaultLevel": {
    "incident": "incident_feed_shock_plus_run",
    "ratio": 0,
    "vaultLossAssets": "193469",
    "basis": "executed on fork: holder value before minus after liquidations (bad debt socialised by Morpho Blue; net of lostAssets on MetaMorpho V1.1, where the share price does not drop)",
    "threshold": 0.01,
    "aboveThreshold": false
  },
  "concentration": {
    "byMarket": {
      "hhi": 0.937991,
      "word": "concentrated",
      "n": 2
    },
    "byCollateral": {
      "hhi": 0.937991,
      "word": "concentrated",
      "groups": [
        {
          "collateral": "WBTC",
          "share": 0.032031
        },
        {
          "collateral": "wstETH",
          "share": 0.967969
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
        "collateral": "WBTC",
        "utilization": 0.8019,
        "aboveWatch": false
      },
      {
        "queueIndex": 5,
        "collateral": "wstETH",
        "utilization": 0.8026,
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
          "wstETH"
        ],
        "exposure": "5895078678349",
        "exposureShare": 0.999998,
        "shocks": [
          {
            "collateral": "WBTC",
            "label": "WBTC market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "10894067784",
            "vaultLossRatio": 0.001847
          },
          {
            "collateral": "wstETH",
            "label": "wstETH market price x0.6 (oracle unchanged: economic shortfall)",
            "vaultLoss": "0",
            "vaultHiddenLoss": "27491896022",
            "vaultLossRatio": 0.004663
          }
        ]
      }
    ]
  }
};
