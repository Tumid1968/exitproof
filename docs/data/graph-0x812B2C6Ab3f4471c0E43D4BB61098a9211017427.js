window.__EXITPROOF__=window.__EXITPROOF__||{};window.__EXITPROOF__["graph:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427"]={
  "schema": "exitproof.graph/0.1",
  "source": {
    "chainId": 1,
    "block": "26157638",
    "blockHash": "0x3e8450286456e913f08f2290aa3eac5e0c8b6d5be51bef3955032d9c43977bf4",
    "timestamp": "1791582443",
    "baseFeePerGas": "121537943"
  },
  "target": {
    "vault": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
    "name": "Vault Bridge WBTC",
    "version": "MetaMorpho V1.1",
    "asset": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    "assetSymbol": "WBTC",
    "assetDecimals": 8
  },
  "summary": {
    "totalAssets": "18612875429",
    "totalSupply": "186046842200037814782",
    "withdrawableNow": "18612875429",
    "lentOutNotWithdrawable": "0",
    "liquidRatio": 1,
    "grossSupplyApyBeforeVaultFee": 1.2098988477760031e-11,
    "vaultPerformanceFee": 0.05,
    "marketCount": 2,
    "exposedMarketCount": 2,
    "peerVaultCount": 1,
    "publicAllocatorIsAllocator": true,
    "publicAllocatorReallocatableIntoExposedMarkets": "0",
    "nodeCount": 42,
    "edgeCount": 44,
    "readCount": 300
  },
  "markets": [
    {
      "id": "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
      "queueIndex": 0,
      "params": {
        "loanToken": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        "collateralToken": "0x0000000000000000000000000000000000000000",
        "oracle": "0x0000000000000000000000000000000000000000",
        "irm": "0x0000000000000000000000000000000000000000",
        "lltv": "0"
      },
      "totalSupplyAssets": "25413875270",
      "totalSupplyShares": "25413875270000000",
      "totalBorrowAssets": "0",
      "totalBorrowShares": "0",
      "lastUpdate": "1791543635",
      "fee": "0",
      "vaultSupplyShares": "18612038912000000",
      "vaultSupplyAssets": "18612038912",
      "liquidity": "25413875270",
      "vaultWithdrawable": "18612038912",
      "utilization": 0,
      "borrowApr": null,
      "supplyApr": null,
      "cap": "100000000000000000000000",
      "collateralSymbol": "none",
      "collateralDecimals": 18,
      "loanDecimals": 8,
      "oraclePrice": null
    },
    {
      "id": "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
      "queueIndex": 1,
      "params": {
        "loanToken": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        "collateralToken": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "oracle": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
        "irm": "0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
        "lltv": "945000000000000000"
      },
      "totalSupplyAssets": "838517",
      "totalSupplyShares": "838517000000",
      "totalBorrowAssets": "900",
      "totalBorrowShares": "900000000",
      "lastUpdate": "1788280571",
      "fee": "0",
      "vaultSupplyShares": "836517000000",
      "vaultSupplyAssets": "836517",
      "liquidity": "837617",
      "vaultWithdrawable": "836517",
      "utilization": 0.001073,
      "borrowApr": 0.00025089442416,
      "supplyApr": 2.6920971712368004e-7,
      "cap": "0",
      "collateralSymbol": "cbBTC",
      "collateralDecimals": 8,
      "loanDecimals": 8,
      "oraclePrice": "1000000000000000000000000000000000000"
    }
  ],
  "peers": [
    {
      "vault": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
      "name": "Gauntlet WBTC Core",
      "version": "MetaMorpho V1.0",
      "totalAssets": "2949934474",
      "topHolder": {
        "address": "0x2E15D7AA0650dE1009710FDd45C3468d75AE1392",
        "shares": "9978203165238499142",
        "assets": "1012641998",
        "shareOfSupply": 0.343276,
        "isContract": false
      },
      "markets": [
        {
          "id": "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
          "supplyAssets": "2813375381",
          "queueIndex": 0
        }
      ],
      "publicAllocator": {
        "enabled": true,
        "flowCaps": [
          {
            "id": "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
            "maxIn": "0",
            "maxOut": "0"
          },
          {
            "id": "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
            "maxIn": "0",
            "maxOut": "0"
          }
        ],
        "reallocatableIn": []
      }
    }
  ],
  "borrowers": {
    "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf": {
      "coverage": 1,
      "count": 0,
      "list": []
    },
    "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f": {
      "coverage": 1,
      "count": 1,
      "list": [
        {
          "address": "0xB47f11484e19f1914D32fd393b17671221C10F1F",
          "borrowShares": "900000000",
          "collateral": "1500",
          "debt": "900",
          "ltv": 0.6
        }
      ]
    }
  },
  "holders": {
    "coverage": 1,
    "list": [
      {
        "address": "0x2C24B57e2CCd1f273045Af6A5f632504C432374F",
        "shares": "185894101368804724214",
        "assets": "18597594621",
        "shareOfSupply": 0.999179,
        "isContract": true
      },
      {
        "address": "0x02cc00667f1B5c30e5FeeDA32331CA2e01A37318",
        "shares": "140205540770960390",
        "assets": "14026727",
        "shareOfSupply": 0.000753,
        "isContract": false
      },
      {
        "address": "0xd3B6d50C64a1729595b92243Fe9d222cb35638B6",
        "shares": "9897335488667031",
        "assets": "990169",
        "shareOfSupply": 0.000053,
        "isContract": false
      },
      {
        "address": "0xC55bDCA87a66d6F87C673d38A2cF4D9e50AA280A",
        "shares": "1480968937308374",
        "assets": "148162",
        "shareOfSupply": 0.000007,
        "isContract": true
      },
      {
        "address": "0x34702F5F789196A723B8DF6334922f145A7db1b2",
        "shares": "396207500264986",
        "assets": "39638",
        "shareOfSupply": 0.000002,
        "isContract": true
      },
      {
        "address": "0xf200EF1DAd3d0cEE48380F860e61362B4f1eb96B",
        "shares": "152532645747554",
        "assets": "15259",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0x52EAF3F04cbac0a4B9878A75AB2523722325D4D4",
        "shares": "150373951165144",
        "assets": "15044",
        "shareOfSupply": 0,
        "isContract": true
      },
      {
        "address": "0xDD8cC9d9Aa7dBD8e897341F394299285255d5650",
        "shares": "111552099898408",
        "assets": "11160",
        "shareOfSupply": 0,
        "isContract": true
      },
      {
        "address": "0xE01dddFB490726df1Fc3A62aB627F05ce673c586",
        "shares": "100259801175706",
        "assets": "10030",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0xF463463Da89164292d41fEe1781b5F1BD543afB9",
        "shares": "99984334988518",
        "assets": "10002",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0x22ed9e1FF9538f01976be7425CC3b070c8e7Ecaf",
        "shares": "99974940400479",
        "assets": "10001",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0x22B11b23E0E773d3F7C9a68340484b9486105D74",
        "shares": "15995217539826",
        "assets": "1600",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0xdC7762656C49419AB45D97384bF85E05F3e26524",
        "shares": "9172251943035",
        "assets": "917",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0xA810d77016C842C15b39B5E40Ffc5e00FA9CD5a6",
        "shares": "6998650233613",
        "assets": "700",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0x1121aFF29666B91181568264Ab0F2Bc58Bf90a11",
        "shares": "4737914104465",
        "assets": "474",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0x9ee3Cab99e98779510589de324E0A511AE4e5ad7",
        "shares": "2838762513370",
        "assets": "284",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0x0f07C26023f08f271B1566c852f685Ab17686A90",
        "shares": "2638869874620",
        "assets": "264",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0x6bD2DeFa6fDc4D3b90DA690A7987b0bEC6BF6d95",
        "shares": "1437277298651",
        "assets": "143",
        "shareOfSupply": 0,
        "isContract": true
      },
      {
        "address": "0x000000000000000000000000000000000000dEaD",
        "shares": "1000000000000",
        "assets": "100",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0xC2780996936211D912f16048f7DCD0e0A91d6904",
        "shares": "767662060321",
        "assets": "76",
        "shareOfSupply": 0,
        "isContract": false
      },
      {
        "address": "0x000000000004444c5dc75cB358380D2e3dE08A90",
        "shares": "514156946067",
        "assets": "51",
        "shareOfSupply": 0,
        "isContract": true
      },
      {
        "address": "0x2D22414C5a37Fff7D41e715a87BFa1Afda77b8ca",
        "shares": "10",
        "assets": "0",
        "shareOfSupply": 0,
        "isContract": true
      }
    ]
  },
  "dex": {
    "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f": {
      "capacity": "463962500",
      "collateralAtRisk": "1500",
      "venues": [
        {
          "id": "univ3:0xe8f7c89C5eFa061e340f2d2F206EC78FD8f7e124",
          "route": "Uniswap V3 0.01% pool",
          "pool": "0xe8f7c89C5eFa061e340f2d2F206EC78FD8f7e124",
          "capacity": "100000000",
          "avgPrice": 1.00128737
        },
        {
          "id": "univ3:0x0da6253560822973185297d5f32fF8fA38243Afe",
          "route": "Uniswap V3 0.05% pool",
          "pool": "0x0da6253560822973185297d5f32fF8fA38243Afe",
          "capacity": "100000000",
          "avgPrice": 1.0000731
        },
        {
          "id": "univ3:0x3b04AC887795b2251E591d7636640d928a74408c",
          "route": "Uniswap V3 0.3% pool",
          "pool": "0x3b04AC887795b2251E591d7636640d928a74408c",
          "capacity": "0",
          "avgPrice": null
        },
        {
          "id": "univ3:0x2853486bB3B9763Eb8a109FaB33f5E08232eA7d5",
          "route": "Uniswap V3 1% pool",
          "pool": "0x2853486bB3B9763Eb8a109FaB33f5E08232eA7d5",
          "capacity": "0",
          "avgPrice": null
        },
        {
          "id": "curve:0x839d6bDeDFF886404A6d7a788ef241e4e28F4802",
          "route": "Curve pool 0x839d6b…",
          "pool": "0x839d6bDeDFF886404A6d7a788ef241e4e28F4802",
          "capacity": "100000000",
          "avgPrice": 1.00096806
        },
        {
          "id": "curve:0x8e5dC7bF5677142EB2ABa4bcFb1e5DCFD6C8a613",
          "route": "Curve pool 0x8e5dC7…",
          "pool": "0x8e5dC7bF5677142EB2ABa4bcFb1e5DCFD6C8a613",
          "capacity": "0",
          "avgPrice": null
        },
        {
          "id": "curve:0x6C49C560cdCB33d991B089F8237e8175564Ff567",
          "route": "Curve pool 0x6C49C5…",
          "pool": "0x6C49C560cdCB33d991B089F8237e8175564Ff567",
          "capacity": "0",
          "avgPrice": null
        },
        {
          "id": "curve:0x66039342C66760874047c36943B1e2d8300363BB",
          "route": "Curve pool 0x660393…",
          "pool": "0x66039342C66760874047c36943B1e2d8300363BB",
          "capacity": "100000000",
          "avgPrice": 1.00047591
        },
        {
          "id": "curve:0xDB1b3CB8731577E5fDCCDb9Ade10996CDa64dF68",
          "route": "Curve pool 0xDB1b3C…",
          "pool": "0xDB1b3CB8731577E5fDCCDb9Ade10996CDa64dF68",
          "capacity": "0",
          "avgPrice": null
        },
        {
          "id": "curve:0x0043d16C636B43Db2Db46df6Bb3d47051041Be3F",
          "route": "Curve pool 0x0043d1…",
          "pool": "0x0043d16C636B43Db2Db46df6Bb3d47051041Be3F",
          "capacity": "0",
          "avgPrice": null
        },
        {
          "id": "2hop:0x66Bb2eCF89C92a11044a46411d0c9E0BC9E31340:0x4585FE77225b41b697C938B018E2Ac67Ac5a20c0",
          "route": "Uniswap V3 0.01% pool → WETH → Uniswap V3 0.05% pool",
          "pool": "0x66Bb2eCF89C92a11044a46411d0c9E0BC9E31340",
          "capacity": "0",
          "avgPrice": null
        },
        {
          "id": "2hop:0x66DD1ACc5da42502ddD469277aed509D1de22b69:0x4585FE77225b41b697C938B018E2Ac67Ac5a20c0",
          "route": "Uniswap V3 0.05% pool → WETH → Uniswap V3 0.05% pool",
          "pool": "0x66DD1ACc5da42502ddD469277aed509D1de22b69",
          "capacity": "0",
          "avgPrice": null
        },
        {
          "id": "2hop:0x15aA01580ae866f9FF4DBe45E06e307941d90C7b:0x4585FE77225b41b697C938B018E2Ac67Ac5a20c0",
          "route": "Uniswap V3 0.3% pool → WETH → Uniswap V3 0.05% pool",
          "pool": "0x15aA01580ae866f9FF4DBe45E06e307941d90C7b",
          "capacity": "63962500",
          "avgPrice": 0.983507070549
        },
        {
          "id": "2hop:0xce1790BB9f2327525d5e99B2C2b92EB5a486c6f8:0x4585FE77225b41b697C938B018E2Ac67Ac5a20c0",
          "route": "Uniswap V3 1% pool → WETH → Uniswap V3 0.05% pool",
          "pool": "0xce1790BB9f2327525d5e99B2C2b92EB5a486c6f8",
          "capacity": "0",
          "avgPrice": null
        },
        {
          "id": "2hop:0x8a4f252812dFF2A8636E4F7EB249d8FC2E3bd77f:0x4585FE77225b41b697C938B018E2Ac67Ac5a20c0",
          "route": "Curve pool 0x8a4f25… → WETH → Uniswap V3 0.05% pool",
          "pool": "0x8a4f252812dFF2A8636E4F7EB249d8FC2E3bd77f",
          "capacity": "5800000",
          "avgPrice": 0.983506551724
        }
      ]
    }
  },
  "nodes": [
    {
      "id": "chain:1",
      "kind": "chain",
      "layer": 0,
      "label": "Ethereum mainnet (chainId 1)",
      "data": {
        "block": "26157638",
        "hash": "0x3e8450286456e913f08f2290aa3eac5e0c8b6d5be51bef3955032d9c43977bf4",
        "timestamp": "1791582443",
        "baseFeePerGas": "121537943",
        "settlement": "Ethereum L1 consensus; archive RPC used for reads"
      },
      "prov": [
        "r1"
      ]
    },
    {
      "id": "vault:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "kind": "vault",
      "layer": 1,
      "label": "Vault Bridge WBTC (MetaMorpho V1.1)",
      "address": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "data": {
        "name": "Vault Bridge WBTC",
        "version": "MetaMorpho V1.1",
        "asset": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        "assetSymbol": "WBTC",
        "totalAssets": "18612875429",
        "totalSupply": "186046842200037814782",
        "timelockSeconds": "259200",
        "performanceFee": 0.05,
        "withdrawQueueLength": "2",
        "codeSize": 19730,
        "isContract": true,
        "owner": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec"
      },
      "prov": [
        "r3",
        "r4",
        "r5",
        "r6",
        "r7",
        "r8",
        "r12",
        "r13",
        "r14",
        "r16",
        "r17",
        "r18",
        "r24"
      ]
    },
    {
      "id": "factory:0x1897A8997241C1cD4bD0698647e4EB7213535c24",
      "kind": "governance",
      "layer": 1,
      "label": "MetaMorpho V1.1 factory",
      "address": "0x1897A8997241C1cD4bD0698647e4EB7213535c24",
      "data": {},
      "prov": [
        "r3"
      ]
    },
    {
      "id": "gov:0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "kind": "governance",
      "layer": 1,
      "label": "Safe 4/6 (owner)",
      "address": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "data": {
        "codeSize": 171,
        "isContract": true,
        "role": "owner",
        "threshold": "4",
        "owners": 6
      },
      "prov": [
        "r25",
        "r32",
        "r33"
      ]
    },
    {
      "id": "gov:0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "kind": "governance",
      "layer": 1,
      "label": "Safe 3/6 (curator)",
      "address": "0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "data": {
        "codeSize": 171,
        "isContract": true,
        "role": "curator",
        "threshold": "3",
        "owners": 6
      },
      "prov": [
        "r34",
        "r41",
        "r42"
      ]
    },
    {
      "id": "gov:0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "kind": "governance",
      "layer": 1,
      "label": "Safe 3/6 (guardian)",
      "address": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "data": {
        "codeSize": 171,
        "isContract": true,
        "role": "guardian",
        "threshold": "3",
        "owners": 6
      },
      "prov": [
        "r43",
        "r50",
        "r51"
      ]
    },
    {
      "id": "alloc:0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D",
      "kind": "allocator",
      "layer": 1,
      "label": "Morpho Public Allocator",
      "address": "0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D",
      "data": {
        "isAllocatorOfTarget": true
      },
      "prov": [
        "r15"
      ]
    },
    {
      "id": "morpho:0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "kind": "governance",
      "layer": 2,
      "label": "Morpho Blue (immutable core)",
      "address": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "data": {
        "codeSize": 15623,
        "isContract": true,
        "owner": "0xcBa28b38103307Ec8dA98377ffF9816C164f9AFa",
        "upgradeable": true
      },
      "prov": [
        "r8",
        "r52",
        "r58"
      ]
    },
    {
      "id": "market:0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
      "kind": "market",
      "layer": 2,
      "label": "none/WBTC LLTV 0.0%",
      "data": {
        "marketId": "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
        "queueIndex": 0,
        "loanToken": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        "collateralToken": "0x0000000000000000000000000000000000000000",
        "oracle": "0x0000000000000000000000000000000000000000",
        "irm": "0x0000000000000000000000000000000000000000",
        "lltv": "0",
        "liquidationIncentiveFactor": 1.15,
        "totalSupplyAssets": "25413875270",
        "totalBorrowAssets": "0",
        "liquidity": "25413875270",
        "utilization": 0,
        "vaultSupplyAssets": "18612038912",
        "vaultWithdrawable": "18612038912",
        "vaultCap": "100000000000000000000000",
        "enabled": true,
        "borrowApr": null,
        "supplyApr": null,
        "oraclePrice": null,
        "supplyFromMetaMorphoVaults": "21425414293",
        "supplyCoverageByVaults": 0.843,
        "peerVaultCount": 1
      },
      "prov": [
        "r59",
        "r60",
        "r61",
        "r62",
        "r63"
      ]
    },
    {
      "id": "market:0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
      "kind": "market",
      "layer": 2,
      "label": "cbBTC/WBTC LLTV 94.5%",
      "data": {
        "marketId": "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
        "queueIndex": 1,
        "loanToken": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        "collateralToken": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "oracle": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
        "irm": "0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
        "lltv": "945000000000000000",
        "liquidationIncentiveFactor": 1.0167768174885614,
        "totalSupplyAssets": "838517",
        "totalBorrowAssets": "900",
        "liquidity": "837617",
        "utilization": 0.001073,
        "vaultSupplyAssets": "836517",
        "vaultWithdrawable": "836517",
        "vaultCap": "0",
        "enabled": true,
        "borrowApr": 0.00025089442416,
        "supplyApr": 2.6920971712368004e-7,
        "oraclePrice": "1000000000000000000000000000000000000",
        "supplyFromMetaMorphoVaults": "836517",
        "supplyCoverageByVaults": 0.9976,
        "peerVaultCount": 0,
        "liquidationCapacityCollateral": "463962500",
        "collateralPostedByBorrowers": "1500"
      },
      "prov": [
        "r64",
        "r65",
        "r66",
        "r67",
        "r68",
        "r69",
        "r70",
        "r71",
        "r72"
      ]
    },
    {
      "id": "irm:0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
      "kind": "irm",
      "layer": 3,
      "label": "Interest rate model",
      "address": "0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
      "data": {},
      "prov": [
        "r66"
      ]
    },
    {
      "id": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "kind": "token",
      "layer": 3,
      "label": "cbBTC (collateral)",
      "address": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "data": {
        "symbol": "cbBTC",
        "codeSize": 1550,
        "isContract": true,
        "zosImpl": "0x7458bfDC30034EB860B265E6068121D18Fa5Aa72",
        "zosAdmin": "0x42D90b3faF2287475cdc863706Bd7cc3E938C2Af",
        "owner": "0xbbc9b6001cf0a4FCcfFAB7bDda1ab16cafb9dB4F",
        "masterMinter": "0x2B5b99D0096a1Ae5641f5041F780A33D004fc1D3",
        "paused": false
      },
      "prov": [
        "r70",
        "r71",
        "r73",
        "r77",
        "r78",
        "r79",
        "r83",
        "r84"
      ]
    },
    {
      "id": "gov:0x42D90b3faF2287475cdc863706Bd7cc3E938C2Af",
      "kind": "governance",
      "layer": 4,
      "label": "EOA (cbBTC proxy admin)",
      "address": "0x42D90b3faF2287475cdc863706Bd7cc3E938C2Af",
      "data": {
        "codeSize": 0,
        "isContract": false,
        "role": "cbBTC proxy admin"
      },
      "prov": [
        "r85"
      ]
    },
    {
      "id": "gov:0xbbc9b6001cf0a4FCcfFAB7bDda1ab16cafb9dB4F",
      "kind": "governance",
      "layer": 4,
      "label": "EOA (cbBTC owner)",
      "address": "0xbbc9b6001cf0a4FCcfFAB7bDda1ab16cafb9dB4F",
      "data": {
        "codeSize": 0,
        "isContract": false,
        "role": "cbBTC owner"
      },
      "prov": [
        "r88"
      ]
    },
    {
      "id": "gov:0x2B5b99D0096a1Ae5641f5041F780A33D004fc1D3",
      "kind": "governance",
      "layer": 4,
      "label": "EOA (cbBTC masterMinter)",
      "address": "0x2B5b99D0096a1Ae5641f5041F780A33D004fc1D3",
      "data": {
        "codeSize": 0,
        "isContract": false,
        "role": "cbBTC masterMinter"
      },
      "prov": [
        "r91"
      ]
    },
    {
      "id": "oracle:0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "kind": "oracle",
      "layer": 3,
      "label": "Oracle router (primary/backup, deviation challenge 2%)",
      "address": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "data": {
        "morphoOracleShape": false,
        "immutable": true,
        "feedCount": 0,
        "codeSize": 45,
        "isContract": true,
        "eip1167Implementation": "0x9B4655239E91dc9E1f7599bB88FBA41B4542de5B",
        "currentOracle": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
        "isPrimary": true,
        "deviationThreshold": "20000000000000000",
        "getDeviation": "5021505660604087",
        "challengeTimelockDuration": "3600",
        "healingTimelockDuration": "7200",
        "isChallenged": false,
        "router": true
      },
      "prov": [
        "r72",
        "r101",
        "r110",
        "r111",
        "r112",
        "r113",
        "r114",
        "r115",
        "r116",
        "r108",
        "r109"
      ]
    },
    {
      "id": "oracle:0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "kind": "oracle",
      "layer": 4,
      "label": "Oracle: 1",
      "address": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "data": {
        "BASE_FEED_1": "0x0000000000000000000000000000000000000000",
        "BASE_FEED_2": "0x0000000000000000000000000000000000000000",
        "QUOTE_FEED_1": "0x0000000000000000000000000000000000000000",
        "QUOTE_FEED_2": "0x0000000000000000000000000000000000000000",
        "BASE_VAULT": "0x0000000000000000000000000000000000000000",
        "QUOTE_VAULT": "0x0000000000000000000000000000000000000000",
        "SCALE_FACTOR": "1000000000000000000000000000000000000",
        "morphoOracleShape": true,
        "immutable": true,
        "feedCount": 0,
        "codeSize": 2598,
        "isContract": true
      },
      "prov": [
        "r117",
        "r118",
        "r119",
        "r120",
        "r121",
        "r122",
        "r123",
        "r124"
      ]
    },
    {
      "id": "oracle:0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "kind": "oracle",
      "layer": 4,
      "label": "Oracle: cbBTC / USD ÷ BTC / USD",
      "address": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "data": {
        "BASE_FEED_1": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
        "BASE_FEED_2": "0x0000000000000000000000000000000000000000",
        "QUOTE_FEED_1": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
        "QUOTE_FEED_2": "0x0000000000000000000000000000000000000000",
        "BASE_VAULT": "0x0000000000000000000000000000000000000000",
        "QUOTE_VAULT": "0x0000000000000000000000000000000000000000",
        "SCALE_FACTOR": "1000000000000000000000000000000000000",
        "morphoOracleShape": true,
        "immutable": true,
        "feedCount": 2,
        "codeSize": 2598,
        "isContract": true
      },
      "prov": [
        "r131",
        "r132",
        "r133",
        "r134",
        "r135",
        "r136",
        "r137",
        "r138"
      ]
    },
    {
      "id": "feed:0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "kind": "feed",
      "layer": 4,
      "label": "cbBTC / USD (Chainlink proxy)",
      "address": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "data": {
        "description": "cbBTC / USD",
        "decimals": 8,
        "answer": "8293380842070",
        "updatedAt": "1791546023",
        "ageSeconds": 36420,
        "observedUpdates": {
          "roundsObserved": 25,
          "maxGapSeconds": 86436,
          "medianGapSeconds": 72960,
          "minTriggeredMovePct": 2.0042633983578804,
          "medianMovePct": 2.0051000494334303,
          "ageWithinObservedMax": true
        },
        "hasAggregator": true,
        "codeSize": 9571,
        "isContract": true,
        "owner": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA"
      },
      "prov": [
        "r145",
        "r146",
        "r147",
        "r148",
        "r149",
        "r155",
        "r156",
        "r157",
        "r158",
        "r159",
        "r160",
        "r161",
        "r162",
        "r163",
        "r164",
        "r165",
        "r166",
        "r167",
        "r168",
        "r169",
        "r170",
        "r171",
        "r172",
        "r173",
        "r174",
        "r175",
        "r176",
        "r177",
        "r178",
        "r179"
      ]
    },
    {
      "id": "agg:0x5e2420cACE3650622f62B2713B2B3727FC8bCDd1",
      "kind": "aggregator",
      "layer": 5,
      "label": "Chainlink aggregator (off-chain node operators)",
      "address": "0x5e2420cACE3650622f62B2713B2B3727FC8bCDd1",
      "data": {
        "minAnswer": "1",
        "maxAnswer": "95780971304118053647396689196894323976171195136475135"
      },
      "prov": [
        "r148",
        "r180",
        "r181"
      ]
    },
    {
      "id": "gov:0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "kind": "governance",
      "layer": 5,
      "label": "Safe 4/9 (feed owner)",
      "address": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "data": {
        "codeSize": 170,
        "isContract": true,
        "role": "feed owner",
        "threshold": "4",
        "owners": 9
      },
      "prov": [
        "r182",
        "r189",
        "r190",
        "r228",
        "r235",
        "r236"
      ]
    },
    {
      "id": "feed:0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "kind": "feed",
      "layer": 4,
      "label": "BTC / USD (Chainlink proxy)",
      "address": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "data": {
        "description": "BTC / USD",
        "decimals": 8,
        "answer": "8251735583226",
        "updatedAt": "1791580979",
        "ageSeconds": 1464,
        "observedUpdates": {
          "roundsObserved": 25,
          "maxGapSeconds": 3636,
          "medianGapSeconds": 3624,
          "minTriggeredMovePct": 0.5006511796211451,
          "medianMovePct": 0.1385563407558259,
          "ageWithinObservedMax": true
        },
        "hasAggregator": true,
        "codeSize": 9571,
        "isContract": true,
        "owner": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA"
      },
      "prov": [
        "r191",
        "r192",
        "r193",
        "r194",
        "r195",
        "r201",
        "r202",
        "r203",
        "r204",
        "r205",
        "r206",
        "r207",
        "r208",
        "r209",
        "r210",
        "r211",
        "r212",
        "r213",
        "r214",
        "r215",
        "r216",
        "r217",
        "r218",
        "r219",
        "r220",
        "r221",
        "r222",
        "r223",
        "r224",
        "r225"
      ]
    },
    {
      "id": "agg:0x4a3411ac2948B33c69666B35cc6d055B27Ea84f1",
      "kind": "aggregator",
      "layer": 5,
      "label": "Chainlink aggregator (off-chain node operators)",
      "address": "0x4a3411ac2948B33c69666B35cc6d055B27Ea84f1",
      "data": {
        "minAnswer": "1",
        "maxAnswer": "95780971304118053647396689196894323976171195136475135"
      },
      "prov": [
        "r194",
        "r226",
        "r227"
      ]
    },
    {
      "id": "holders:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "kind": "holders",
      "layer": 1,
      "label": "Holders: top 22 = 100.0% of shares",
      "data": {
        "coverage": 1,
        "largestShare": 0.999179,
        "top3Share": 0.999985
      },
      "prov": [
        "r237",
        "r238",
        "r239"
      ]
    },
    {
      "id": "peer:0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
      "kind": "peerVault",
      "layer": 2,
      "label": "Gauntlet WBTC Core (peer vault)",
      "address": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
      "data": {
        "totalAssets": "2949934474",
        "version": "MetaMorpho V1.0",
        "publicAllocatorEnabled": true
      },
      "prov": [
        "r240",
        "r244",
        "r245",
        "r249",
        "r250",
        "r251",
        "r253",
        "r254",
        "r255"
      ]
    },
    {
      "id": "borrowers:0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
      "kind": "borrowers",
      "layer": 3,
      "label": "0 borrowers (100.00% of debt identified)",
      "data": {
        "count": 0,
        "coverage": 1,
        "largestShare": 0,
        "maxLtv": 0
      },
      "prov": [
        "r256"
      ]
    },
    {
      "id": "borrowers:0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
      "kind": "borrowers",
      "layer": 3,
      "label": "1 borrowers (100.00% of debt identified)",
      "data": {
        "count": 1,
        "coverage": 1,
        "largestDebt": "900",
        "largestShare": 1,
        "maxLtv": 0.6
      },
      "prov": [
        "r257",
        "r258"
      ]
    },
    {
      "id": "dex:0xe8f7c89C5eFa061e340f2d2F206EC78FD8f7e124",
      "kind": "dex",
      "layer": 4,
      "label": "Uniswap V3 0.01% pool",
      "address": "0xe8f7c89C5eFa061e340f2d2F206EC78FD8f7e124",
      "data": {
        "venue": "uniswap-v3"
      },
      "prov": [
        "r260",
        "r286"
      ]
    },
    {
      "id": "dex:0x0da6253560822973185297d5f32fF8fA38243Afe",
      "kind": "dex",
      "layer": 4,
      "label": "Uniswap V3 0.05% pool",
      "address": "0x0da6253560822973185297d5f32fF8fA38243Afe",
      "data": {
        "venue": "uniswap-v3"
      },
      "prov": [
        "r261",
        "r287"
      ]
    },
    {
      "id": "dex:0x3b04AC887795b2251E591d7636640d928a74408c",
      "kind": "dex",
      "layer": 4,
      "label": "Uniswap V3 0.3% pool",
      "address": "0x3b04AC887795b2251E591d7636640d928a74408c",
      "data": {
        "venue": "uniswap-v3"
      },
      "prov": [
        "r262",
        "r288"
      ]
    },
    {
      "id": "dex:0x2853486bB3B9763Eb8a109FaB33f5E08232eA7d5",
      "kind": "dex",
      "layer": 4,
      "label": "Uniswap V3 1% pool",
      "address": "0x2853486bB3B9763Eb8a109FaB33f5E08232eA7d5",
      "data": {
        "venue": "uniswap-v3"
      },
      "prov": [
        "r263",
        "r289"
      ]
    },
    {
      "id": "dex:0x839d6bDeDFF886404A6d7a788ef241e4e28F4802",
      "kind": "dex",
      "layer": 4,
      "label": "Curve pool 0x839d6b…",
      "address": "0x839d6bDeDFF886404A6d7a788ef241e4e28F4802",
      "data": {
        "venue": "curve"
      },
      "prov": [
        "r264",
        "r265",
        "r290"
      ]
    },
    {
      "id": "dex:0x8e5dC7bF5677142EB2ABa4bcFb1e5DCFD6C8a613",
      "kind": "dex",
      "layer": 4,
      "label": "Curve pool 0x8e5dC7…",
      "address": "0x8e5dC7bF5677142EB2ABa4bcFb1e5DCFD6C8a613",
      "data": {
        "venue": "curve"
      },
      "prov": [
        "r264",
        "r266",
        "r291"
      ]
    },
    {
      "id": "dex:0x6C49C560cdCB33d991B089F8237e8175564Ff567",
      "kind": "dex",
      "layer": 4,
      "label": "Curve pool 0x6C49C5…",
      "address": "0x6C49C560cdCB33d991B089F8237e8175564Ff567",
      "data": {
        "venue": "curve"
      },
      "prov": [
        "r264",
        "r267",
        "r292"
      ]
    },
    {
      "id": "dex:0x66039342C66760874047c36943B1e2d8300363BB",
      "kind": "dex",
      "layer": 4,
      "label": "Curve pool 0x660393…",
      "address": "0x66039342C66760874047c36943B1e2d8300363BB",
      "data": {
        "venue": "curve"
      },
      "prov": [
        "r264",
        "r268",
        "r293"
      ]
    },
    {
      "id": "dex:0xDB1b3CB8731577E5fDCCDb9Ade10996CDa64dF68",
      "kind": "dex",
      "layer": 4,
      "label": "Curve pool 0xDB1b3C…",
      "address": "0xDB1b3CB8731577E5fDCCDb9Ade10996CDa64dF68",
      "data": {
        "venue": "curve"
      },
      "prov": [
        "r264",
        "r269",
        "r294"
      ]
    },
    {
      "id": "dex:0x0043d16C636B43Db2Db46df6Bb3d47051041Be3F",
      "kind": "dex",
      "layer": 4,
      "label": "Curve pool 0x0043d1…",
      "address": "0x0043d16C636B43Db2Db46df6Bb3d47051041Be3F",
      "data": {
        "venue": "curve"
      },
      "prov": [
        "r264",
        "r270",
        "r295"
      ]
    },
    {
      "id": "dex:0x66Bb2eCF89C92a11044a46411d0c9E0BC9E31340",
      "kind": "dex",
      "layer": 4,
      "label": "Uniswap V3 0.01% pool → WETH → Uniswap V3 0.05% pool",
      "address": "0x66Bb2eCF89C92a11044a46411d0c9E0BC9E31340",
      "data": {
        "venue": "two-hop"
      },
      "prov": [
        "r280",
        "r273",
        "r296"
      ]
    },
    {
      "id": "dex:0x66DD1ACc5da42502ddD469277aed509D1de22b69",
      "kind": "dex",
      "layer": 4,
      "label": "Uniswap V3 0.05% pool → WETH → Uniswap V3 0.05% pool",
      "address": "0x66DD1ACc5da42502ddD469277aed509D1de22b69",
      "data": {
        "venue": "two-hop"
      },
      "prov": [
        "r281",
        "r273",
        "r297"
      ]
    },
    {
      "id": "dex:0x15aA01580ae866f9FF4DBe45E06e307941d90C7b",
      "kind": "dex",
      "layer": 4,
      "label": "Uniswap V3 0.3% pool → WETH → Uniswap V3 0.05% pool",
      "address": "0x15aA01580ae866f9FF4DBe45E06e307941d90C7b",
      "data": {
        "venue": "two-hop"
      },
      "prov": [
        "r282",
        "r273",
        "r298"
      ]
    },
    {
      "id": "dex:0xce1790BB9f2327525d5e99B2C2b92EB5a486c6f8",
      "kind": "dex",
      "layer": 4,
      "label": "Uniswap V3 1% pool → WETH → Uniswap V3 0.05% pool",
      "address": "0xce1790BB9f2327525d5e99B2C2b92EB5a486c6f8",
      "data": {
        "venue": "two-hop"
      },
      "prov": [
        "r283",
        "r273",
        "r299"
      ]
    },
    {
      "id": "dex:0x8a4f252812dFF2A8636E4F7EB249d8FC2E3bd77f",
      "kind": "dex",
      "layer": 4,
      "label": "Curve pool 0x8a4f25… → WETH → Uniswap V3 0.05% pool",
      "address": "0x8a4f252812dFF2A8636E4F7EB249d8FC2E3bd77f",
      "data": {
        "venue": "two-hop"
      },
      "prov": [
        "r284",
        "r285",
        "r273",
        "r300"
      ]
    }
  ],
  "edges": [
    {
      "from": "vault:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "to": "chain:1",
      "rel": "settles on",
      "prov": [
        "r1"
      ]
    },
    {
      "from": "vault:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "to": "factory:0x1897A8997241C1cD4bD0698647e4EB7213535c24",
      "rel": "created by (isMetaMorpho=true)",
      "prov": [
        "r3"
      ]
    },
    {
      "from": "vault:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "to": "gov:0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "rel": "owner (can change caps/queues/fees; timelock 259200s)",
      "prov": [
        "r9"
      ]
    },
    {
      "from": "vault:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "to": "gov:0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "rel": "curator (can change caps/queues/fees; timelock 259200s)",
      "prov": [
        "r10"
      ]
    },
    {
      "from": "vault:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "to": "gov:0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "rel": "guardian (can change caps/queues/fees: veto only; timelock 259200s)",
      "prov": [
        "r11"
      ]
    },
    {
      "from": "vault:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "to": "alloc:0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D",
      "rel": "allocator (can move this vault's funds between its markets)",
      "prov": [
        "r15"
      ]
    },
    {
      "from": "vault:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "to": "morpho:0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "rel": "supplies through",
      "prov": [
        "r8"
      ]
    },
    {
      "from": "vault:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "to": "market:0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
      "rel": "withdraw queue #0",
      "data": {
        "vaultSupplyAssets": "18612038912",
        "withdrawable": "18612038912"
      },
      "prov": [
        "r59",
        "r63"
      ]
    },
    {
      "from": "market:0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
      "to": "morpho:0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "rel": "lives in",
      "prov": [
        "r61"
      ]
    },
    {
      "from": "vault:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "to": "market:0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
      "rel": "withdraw queue #1",
      "data": {
        "vaultSupplyAssets": "836517",
        "withdrawable": "836517"
      },
      "prov": [
        "r64",
        "r68"
      ]
    },
    {
      "from": "market:0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
      "to": "morpho:0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "rel": "lives in",
      "prov": [
        "r66"
      ]
    },
    {
      "from": "market:0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
      "to": "irm:0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
      "rel": "borrow rate set by",
      "data": {
        "borrowApr": 0.00025089442416
      },
      "prov": [
        "r66",
        "r69"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "gov:0x42D90b3faF2287475cdc863706Bd7cc3E938C2Af",
      "rel": "upgradeable proxy (upgrade admin 0x42D90b3f…); implementation 0x7458bfDC30034EB860B265E6068121D18Fa5Aa72",
      "prov": [
        "r73",
        "r77",
        "r78",
        "r79"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "gov:0xbbc9b6001cf0a4FCcfFAB7bDda1ab16cafb9dB4F",
      "rel": "owner() (privileged role on token)",
      "prov": [
        "r73",
        "r77",
        "r78",
        "r79"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "gov:0x2B5b99D0096a1Ae5641f5041F780A33D004fc1D3",
      "rel": "masterMinter (controls minting: custodial issuance)",
      "prov": [
        "r83"
      ]
    },
    {
      "from": "market:0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
      "to": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "rel": "collateral",
      "prov": [
        "r70",
        "r71"
      ]
    },
    {
      "from": "oracle:0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "to": "oracle:0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "rel": "primary leg",
      "prov": [
        "r108"
      ]
    },
    {
      "from": "feed:0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "to": "agg:0x5e2420cACE3650622f62B2713B2B3727FC8bCDd1",
      "rel": "reads answers from",
      "prov": [
        "r148"
      ]
    },
    {
      "from": "feed:0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "to": "gov:0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "rel": "owner (can switch aggregator)",
      "prov": [
        "r149",
        "r155"
      ]
    },
    {
      "from": "oracle:0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "to": "feed:0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "rel": "BASE_FEED_1",
      "prov": [
        "r131",
        "r132",
        "r133",
        "r134",
        "r135",
        "r136",
        "r137"
      ]
    },
    {
      "from": "feed:0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "to": "agg:0x4a3411ac2948B33c69666B35cc6d055B27Ea84f1",
      "rel": "reads answers from",
      "prov": [
        "r194"
      ]
    },
    {
      "from": "feed:0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "to": "gov:0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "rel": "owner (can switch aggregator)",
      "prov": [
        "r195",
        "r201"
      ]
    },
    {
      "from": "oracle:0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "to": "feed:0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "rel": "QUOTE_FEED_1",
      "prov": [
        "r131",
        "r132",
        "r133",
        "r134",
        "r135",
        "r136",
        "r137"
      ]
    },
    {
      "from": "oracle:0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "to": "oracle:0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "rel": "backup leg",
      "prov": [
        "r109"
      ]
    },
    {
      "from": "market:0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
      "to": "oracle:0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "rel": "priced by (liquidations & borrow limits)",
      "prov": [
        "r66"
      ]
    },
    {
      "from": "vault:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "to": "holders:0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "rel": "owned by (concentration = who can drain liquidity first)",
      "prov": [
        "r237",
        "r238",
        "r239"
      ]
    },
    {
      "from": "peer:0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
      "to": "market:0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
      "rel": "also lends here (queue #0)",
      "data": {
        "supplyAssets": "2813375381"
      },
      "prov": [
        "r240",
        "r243",
        "r247"
      ]
    },
    {
      "from": "market:0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
      "to": "borrowers:0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
      "rel": "lent to (repayment is the only way idle liquidity comes back)",
      "prov": [
        "r256"
      ]
    },
    {
      "from": "market:0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
      "to": "borrowers:0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
      "rel": "lent to (repayment is the only way idle liquidity comes back)",
      "prov": [
        "r257"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0xe8f7c89C5eFa061e340f2d2F206EC78FD8f7e124",
      "rel": "sold by liquidators via",
      "prov": [
        "r260",
        "r286"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x0da6253560822973185297d5f32fF8fA38243Afe",
      "rel": "sold by liquidators via",
      "prov": [
        "r261",
        "r287"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x3b04AC887795b2251E591d7636640d928a74408c",
      "rel": "sold by liquidators via",
      "prov": [
        "r262",
        "r288"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x2853486bB3B9763Eb8a109FaB33f5E08232eA7d5",
      "rel": "sold by liquidators via",
      "prov": [
        "r263",
        "r289"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x839d6bDeDFF886404A6d7a788ef241e4e28F4802",
      "rel": "sold by liquidators via",
      "prov": [
        "r264",
        "r265",
        "r290"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x8e5dC7bF5677142EB2ABa4bcFb1e5DCFD6C8a613",
      "rel": "sold by liquidators via",
      "prov": [
        "r264",
        "r266",
        "r291"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x6C49C560cdCB33d991B089F8237e8175564Ff567",
      "rel": "sold by liquidators via",
      "prov": [
        "r264",
        "r267",
        "r292"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x66039342C66760874047c36943B1e2d8300363BB",
      "rel": "sold by liquidators via",
      "prov": [
        "r264",
        "r268",
        "r293"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0xDB1b3CB8731577E5fDCCDb9Ade10996CDa64dF68",
      "rel": "sold by liquidators via",
      "prov": [
        "r264",
        "r269",
        "r294"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x0043d16C636B43Db2Db46df6Bb3d47051041Be3F",
      "rel": "sold by liquidators via",
      "prov": [
        "r264",
        "r270",
        "r295"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x66Bb2eCF89C92a11044a46411d0c9E0BC9E31340",
      "rel": "sold by liquidators via",
      "prov": [
        "r280",
        "r273",
        "r296"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x66DD1ACc5da42502ddD469277aed509D1de22b69",
      "rel": "sold by liquidators via",
      "prov": [
        "r281",
        "r273",
        "r297"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x15aA01580ae866f9FF4DBe45E06e307941d90C7b",
      "rel": "sold by liquidators via",
      "prov": [
        "r282",
        "r273",
        "r298"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0xce1790BB9f2327525d5e99B2C2b92EB5a486c6f8",
      "rel": "sold by liquidators via",
      "prov": [
        "r283",
        "r273",
        "r299"
      ]
    },
    {
      "from": "token:0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "to": "dex:0x8a4f252812dFF2A8636E4F7EB249d8FC2E3bd77f",
      "rel": "sold by liquidators via",
      "prov": [
        "r284",
        "r285",
        "r273",
        "r300"
      ]
    }
  ],
  "reads": [
    {
      "id": "r1",
      "block": "26157638",
      "method": "eth_getBlockByNumber",
      "ok": true,
      "result": {
        "number": "26157638",
        "hash": "0x3e8450286456e913f08f2290aa3eac5e0c8b6d5be51bef3955032d9c43977bf4",
        "timestamp": "1791582443",
        "baseFeePerGas": "121537943"
      }
    },
    {
      "id": "r2",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xA9c3D3a366466Fa809d1Ae982Fb2c46E5fC41101",
      "fn": "isMetaMorpho(address)",
      "args": [
        "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427"
      ],
      "ok": true,
      "result": false
    },
    {
      "id": "r3",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1897A8997241C1cD4bD0698647e4EB7213535c24",
      "fn": "isMetaMorpho(address)",
      "args": [
        "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427"
      ],
      "ok": true,
      "result": true
    },
    {
      "id": "r4",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "name()",
      "args": [],
      "ok": true,
      "result": "Vault Bridge WBTC"
    },
    {
      "id": "r5",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "asset()",
      "args": [],
      "ok": true,
      "result": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
    },
    {
      "id": "r6",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "totalAssets()",
      "args": [],
      "ok": true,
      "result": "18612875429"
    },
    {
      "id": "r7",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "totalSupply()",
      "args": [],
      "ok": true,
      "result": "186046842200037814782"
    },
    {
      "id": "r8",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "MORPHO()",
      "args": [],
      "ok": true,
      "result": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb"
    },
    {
      "id": "r9",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "owner()",
      "args": [],
      "ok": true,
      "result": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec"
    },
    {
      "id": "r10",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "curator()",
      "args": [],
      "ok": true,
      "result": "0x9E33faAE38ff641094fa68c65c2cE600b3410585"
    },
    {
      "id": "r11",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "guardian()",
      "args": [],
      "ok": true,
      "result": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD"
    },
    {
      "id": "r12",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "timelock()",
      "args": [],
      "ok": true,
      "result": "259200"
    },
    {
      "id": "r13",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "fee()",
      "args": [],
      "ok": true,
      "result": "50000000000000000"
    },
    {
      "id": "r14",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "withdrawQueueLength()",
      "args": [],
      "ok": true,
      "result": "2"
    },
    {
      "id": "r15",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "isAllocator(address)",
      "args": [
        "0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D"
      ],
      "ok": true,
      "result": true
    },
    {
      "id": "r16",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      "fn": "symbol()",
      "args": [],
      "ok": true,
      "result": "WBTC"
    },
    {
      "id": "r17",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      "fn": "decimals()",
      "args": [],
      "ok": true,
      "result": 8
    },
    {
      "id": "r18",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "ok": true,
      "result": {
        "size": 19730,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r19",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r20",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r21",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r22",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r23",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r24",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "owner()",
      "args": [],
      "ok": true,
      "result": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec"
    },
    {
      "id": "r25",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "ok": true,
      "result": {
        "size": 171,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r26",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r27",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r28",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r29",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r30",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r31",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "fn": "owner()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"owner\" reverted."
    },
    {
      "id": "r32",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "fn": "getThreshold()",
      "args": [],
      "ok": true,
      "result": "4"
    },
    {
      "id": "r33",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xC684c6587712e5E7BDf9fD64415F23Bd2b05fAec",
      "fn": "getOwners()",
      "args": [],
      "ok": true,
      "result": [
        "0x6C8038257C618Fd7D25269fc97C04DE8a5b2b843",
        "0x59520256bfd073d131Da8C8F58c4eef979bC64c7",
        "0xa3A845fcdE05Ea884eA033b150300f0f8BDfa01d",
        "0x1F6DA8198Fe51236E279009B325F107Ddce4D2b6",
        "0x1D8e0b8F4CEd9262C9ac0c0870BF8B45D74ad9D9",
        "0xd0644E17C6Ad2B34932cB6D8Dc6026000DA5FF2e"
      ]
    },
    {
      "id": "r34",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "ok": true,
      "result": {
        "size": 171,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r35",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r36",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r37",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r38",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r39",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r40",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "fn": "owner()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"owner\" reverted."
    },
    {
      "id": "r41",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "fn": "getThreshold()",
      "args": [],
      "ok": true,
      "result": "3"
    },
    {
      "id": "r42",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x9E33faAE38ff641094fa68c65c2cE600b3410585",
      "fn": "getOwners()",
      "args": [],
      "ok": true,
      "result": [
        "0x6C8038257C618Fd7D25269fc97C04DE8a5b2b843",
        "0x59520256bfd073d131Da8C8F58c4eef979bC64c7",
        "0xa3A845fcdE05Ea884eA033b150300f0f8BDfa01d",
        "0xd0644E17C6Ad2B34932cB6D8Dc6026000DA5FF2e",
        "0x1F6DA8198Fe51236E279009B325F107Ddce4D2b6",
        "0x1D8e0b8F4CEd9262C9ac0c0870BF8B45D74ad9D9"
      ]
    },
    {
      "id": "r43",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "ok": true,
      "result": {
        "size": 171,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r44",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r45",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r46",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r47",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r48",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r49",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "fn": "owner()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"owner\" reverted."
    },
    {
      "id": "r50",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "fn": "getThreshold()",
      "args": [],
      "ok": true,
      "result": "3"
    },
    {
      "id": "r51",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x7084bF4dB6c21e1834dD6482f6056a39A33584cD",
      "fn": "getOwners()",
      "args": [],
      "ok": true,
      "result": [
        "0x59520256bfd073d131Da8C8F58c4eef979bC64c7",
        "0xd0644E17C6Ad2B34932cB6D8Dc6026000DA5FF2e",
        "0x1F6DA8198Fe51236E279009B325F107Ddce4D2b6",
        "0x1D8e0b8F4CEd9262C9ac0c0870BF8B45D74ad9D9",
        "0x6C8038257C618Fd7D25269fc97C04DE8a5b2b843",
        "0xa3A845fcdE05Ea884eA033b150300f0f8BDfa01d"
      ]
    },
    {
      "id": "r52",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "ok": true,
      "result": {
        "size": 15623,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r53",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r54",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r55",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r56",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r57",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r58",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "fn": "owner()",
      "args": [],
      "ok": true,
      "result": "0xcBa28b38103307Ec8dA98377ffF9816C164f9AFa"
    },
    {
      "id": "r59",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "withdrawQueue(uint256)",
      "args": [
        "0"
      ],
      "ok": true,
      "result": "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf"
    },
    {
      "id": "r60",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "config(bytes32)",
      "args": [
        "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf"
      ],
      "ok": true,
      "result": [
        "100000000000000000000000",
        true,
        "0"
      ]
    },
    {
      "id": "r61",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "fn": "idToMarketParams(bytes32)",
      "args": [
        "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf"
      ],
      "ok": true,
      "result": [
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000",
        "0"
      ]
    },
    {
      "id": "r62",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "fn": "market(bytes32)",
      "args": [
        "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf"
      ],
      "ok": true,
      "result": [
        "25413875270",
        "25413875270000000",
        "0",
        "0",
        "1791543635",
        "0"
      ]
    },
    {
      "id": "r63",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "fn": "position(bytes32,address)",
      "args": [
        "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
        "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427"
      ],
      "ok": true,
      "result": [
        "18612038912000000",
        "0",
        "0"
      ]
    },
    {
      "id": "r64",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "withdrawQueue(uint256)",
      "args": [
        "1"
      ],
      "ok": true,
      "result": "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f"
    },
    {
      "id": "r65",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
      "fn": "config(bytes32)",
      "args": [
        "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f"
      ],
      "ok": true,
      "result": [
        "0",
        true,
        "0"
      ]
    },
    {
      "id": "r66",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "fn": "idToMarketParams(bytes32)",
      "args": [
        "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f"
      ],
      "ok": true,
      "result": [
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
        "0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
        "945000000000000000"
      ]
    },
    {
      "id": "r67",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "fn": "market(bytes32)",
      "args": [
        "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f"
      ],
      "ok": true,
      "result": [
        "838517",
        "838517000000",
        "900",
        "900000000",
        "1788280571",
        "0"
      ]
    },
    {
      "id": "r68",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
      "fn": "position(bytes32,address)",
      "args": [
        "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
        "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427"
      ],
      "ok": true,
      "result": [
        "836517000000",
        "0",
        "0"
      ]
    },
    {
      "id": "r69",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
      "fn": "borrowRateView(tuple,tuple)",
      "args": [
        {
          "loanToken": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "collateralToken": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
          "oracle": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
          "irm": "0x870aC11D48B15DB9a138Cf899d20F13F79Ba00BC",
          "lltv": "945000000000000000"
        },
        {
          "totalSupplyAssets": "838517",
          "totalSupplyShares": "838517000000",
          "totalBorrowAssets": "900",
          "totalBorrowShares": "900000000",
          "lastUpdate": "1788280571",
          "fee": "0"
        }
      ],
      "ok": true,
      "result": "7955810"
    },
    {
      "id": "r70",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "fn": "symbol()",
      "args": [],
      "ok": true,
      "result": "cbBTC"
    },
    {
      "id": "r71",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "fn": "decimals()",
      "args": [],
      "ok": true,
      "result": 8
    },
    {
      "id": "r72",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "price()",
      "args": [],
      "ok": true,
      "result": "1000000000000000000000000000000000000"
    },
    {
      "id": "r73",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "ok": true,
      "result": {
        "size": 1550,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r74",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r75",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r76",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r77",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000007458bfdc30034eb860b265e6068121d18fa5aa72"
    },
    {
      "id": "r78",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x00000000000000000000000042d90b3faf2287475cdc863706bd7cc3e938c2af"
    },
    {
      "id": "r79",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "fn": "owner()",
      "args": [],
      "ok": true,
      "result": "0xbbc9b6001cf0a4FCcfFAB7bDda1ab16cafb9dB4F"
    },
    {
      "id": "r80",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "fn": "stETH()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"stETH\" reverted."
    },
    {
      "id": "r81",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "fn": "stEthPerToken()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"stEthPerToken\" reverted."
    },
    {
      "id": "r82",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "fn": "asset()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"asset\" reverted."
    },
    {
      "id": "r83",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "fn": "masterMinter()",
      "args": [],
      "ok": true,
      "result": "0x2B5b99D0096a1Ae5641f5041F780A33D004fc1D3"
    },
    {
      "id": "r84",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "fn": "paused()",
      "args": [],
      "ok": true,
      "result": false
    },
    {
      "id": "r85",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0x42D90b3faF2287475cdc863706Bd7cc3E938C2Af",
      "ok": true,
      "result": {
        "size": 0,
        "prefix": "0x"
      }
    },
    {
      "id": "r86",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x42D90b3faF2287475cdc863706Bd7cc3E938C2Af",
      "fn": "getThreshold()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"getThreshold\" returned no data (\"0x\")."
    },
    {
      "id": "r87",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x42D90b3faF2287475cdc863706Bd7cc3E938C2Af",
      "fn": "getOwners()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"getOwners\" returned no data (\"0x\")."
    },
    {
      "id": "r88",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0xbbc9b6001cf0a4FCcfFAB7bDda1ab16cafb9dB4F",
      "ok": true,
      "result": {
        "size": 0,
        "prefix": "0x"
      }
    },
    {
      "id": "r89",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xbbc9b6001cf0a4FCcfFAB7bDda1ab16cafb9dB4F",
      "fn": "getThreshold()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"getThreshold\" returned no data (\"0x\")."
    },
    {
      "id": "r90",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xbbc9b6001cf0a4FCcfFAB7bDda1ab16cafb9dB4F",
      "fn": "getOwners()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"getOwners\" returned no data (\"0x\")."
    },
    {
      "id": "r91",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0x2B5b99D0096a1Ae5641f5041F780A33D004fc1D3",
      "ok": true,
      "result": {
        "size": 0,
        "prefix": "0x"
      }
    },
    {
      "id": "r92",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2B5b99D0096a1Ae5641f5041F780A33D004fc1D3",
      "fn": "getThreshold()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"getThreshold\" returned no data (\"0x\")."
    },
    {
      "id": "r93",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2B5b99D0096a1Ae5641f5041F780A33D004fc1D3",
      "fn": "getOwners()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"getOwners\" returned no data (\"0x\")."
    },
    {
      "id": "r94",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "BASE_FEED_1()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"BASE_FEED_1\" reverted."
    },
    {
      "id": "r95",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "BASE_FEED_2()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"BASE_FEED_2\" reverted."
    },
    {
      "id": "r96",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "QUOTE_FEED_1()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"QUOTE_FEED_1\" reverted."
    },
    {
      "id": "r97",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "QUOTE_FEED_2()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"QUOTE_FEED_2\" reverted."
    },
    {
      "id": "r98",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "BASE_VAULT()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"BASE_VAULT\" reverted."
    },
    {
      "id": "r99",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "QUOTE_VAULT()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"QUOTE_VAULT\" reverted."
    },
    {
      "id": "r100",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "SCALE_FACTOR()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"SCALE_FACTOR\" reverted."
    },
    {
      "id": "r101",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "ok": true,
      "result": {
        "size": 45,
        "prefix": "0x363d3d37"
      }
    },
    {
      "id": "r102",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r103",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r104",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r105",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r106",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r107",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "owner()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"owner\" reverted."
    },
    {
      "id": "r108",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "primaryOracle()",
      "args": [],
      "ok": true,
      "result": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4"
    },
    {
      "id": "r109",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "backupOracle()",
      "args": [],
      "ok": true,
      "result": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1"
    },
    {
      "id": "r110",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "currentOracle()",
      "args": [],
      "ok": true,
      "result": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4"
    },
    {
      "id": "r111",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "isPrimary()",
      "args": [],
      "ok": true,
      "result": true
    },
    {
      "id": "r112",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "deviationThreshold()",
      "args": [],
      "ok": true,
      "result": "20000000000000000"
    },
    {
      "id": "r113",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "getDeviation()",
      "args": [],
      "ok": true,
      "result": "5021505660604087"
    },
    {
      "id": "r114",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "challengeTimelockDuration()",
      "args": [],
      "ok": true,
      "result": "3600"
    },
    {
      "id": "r115",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "healingTimelockDuration()",
      "args": [],
      "ok": true,
      "result": "7200"
    },
    {
      "id": "r116",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xD776c7be7a06212c0F93eD478d3ba4Ce4fA55D31",
      "fn": "isChallenged()",
      "args": [],
      "ok": true,
      "result": false
    },
    {
      "id": "r117",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "fn": "BASE_FEED_1()",
      "args": [],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000"
    },
    {
      "id": "r118",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "fn": "BASE_FEED_2()",
      "args": [],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000"
    },
    {
      "id": "r119",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "fn": "QUOTE_FEED_1()",
      "args": [],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000"
    },
    {
      "id": "r120",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "fn": "QUOTE_FEED_2()",
      "args": [],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000"
    },
    {
      "id": "r121",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "fn": "BASE_VAULT()",
      "args": [],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000"
    },
    {
      "id": "r122",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "fn": "QUOTE_VAULT()",
      "args": [],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000"
    },
    {
      "id": "r123",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "fn": "SCALE_FACTOR()",
      "args": [],
      "ok": true,
      "result": "1000000000000000000000000000000000000"
    },
    {
      "id": "r124",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "ok": true,
      "result": {
        "size": 2598,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r125",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r126",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r127",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r128",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r129",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r130",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xCd66528816A5BFa8D57600e3ec53581065a5c6F4",
      "fn": "owner()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"owner\" reverted."
    },
    {
      "id": "r131",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "fn": "BASE_FEED_1()",
      "args": [],
      "ok": true,
      "result": "0x2665701293fCbEB223D11A08D826563EDcCE423A"
    },
    {
      "id": "r132",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "fn": "BASE_FEED_2()",
      "args": [],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000"
    },
    {
      "id": "r133",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "fn": "QUOTE_FEED_1()",
      "args": [],
      "ok": true,
      "result": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c"
    },
    {
      "id": "r134",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "fn": "QUOTE_FEED_2()",
      "args": [],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000"
    },
    {
      "id": "r135",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "fn": "BASE_VAULT()",
      "args": [],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000"
    },
    {
      "id": "r136",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "fn": "QUOTE_VAULT()",
      "args": [],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000"
    },
    {
      "id": "r137",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "fn": "SCALE_FACTOR()",
      "args": [],
      "ok": true,
      "result": "1000000000000000000000000000000000000"
    },
    {
      "id": "r138",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "ok": true,
      "result": {
        "size": 2598,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r139",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r140",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r141",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r142",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r143",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r144",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xA2C6c0e0E93430bcD2bd46AA2a2C9fBc5b1B12c1",
      "fn": "owner()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"owner\" reverted."
    },
    {
      "id": "r145",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "description()",
      "args": [],
      "ok": true,
      "result": "cbBTC / USD"
    },
    {
      "id": "r146",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "decimals()",
      "args": [],
      "ok": true,
      "result": 8
    },
    {
      "id": "r147",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "latestRoundData()",
      "args": [],
      "ok": true,
      "result": [
        "18446744073709552903",
        "8293380842070",
        "1791546000",
        "1791546023",
        "18446744073709552903"
      ]
    },
    {
      "id": "r148",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "aggregator()",
      "args": [],
      "ok": true,
      "result": "0x5e2420cACE3650622f62B2713B2B3727FC8bCDd1"
    },
    {
      "id": "r149",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "ok": true,
      "result": {
        "size": 9571,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r150",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r151",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r152",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r153",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r154",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r155",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "owner()",
      "args": [],
      "ok": true,
      "result": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA"
    },
    {
      "id": "r156",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552902"
      ],
      "ok": true,
      "result": [
        "18446744073709552902",
        "8130425695720",
        "1791473006",
        "1791473063",
        "18446744073709552902"
      ]
    },
    {
      "id": "r157",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552901"
      ],
      "ok": true,
      "result": [
        "18446744073709552901",
        "8310274251579",
        "1791425015",
        "1791425027",
        "18446744073709552901"
      ]
    },
    {
      "id": "r158",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552900"
      ],
      "ok": true,
      "result": [
        "18446744073709552900",
        "8373695920763",
        "1791338607",
        "1791338627",
        "18446744073709552900"
      ]
    },
    {
      "id": "r159",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552899"
      ],
      "ok": true,
      "result": [
        "18446744073709552899",
        "8555251778729",
        "1791306913",
        "1791306935",
        "18446744073709552899"
      ]
    },
    {
      "id": "r160",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552898"
      ],
      "ok": true,
      "result": [
        "18446744073709552898",
        "8527032943125",
        "1791220499",
        "1791220523",
        "18446744073709552898"
      ]
    },
    {
      "id": "r161",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552897"
      ],
      "ok": true,
      "result": [
        "18446744073709552897",
        "8531590821490",
        "1791134089",
        "1791134111",
        "18446744073709552897"
      ]
    },
    {
      "id": "r162",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552896"
      ],
      "ok": true,
      "result": [
        "18446744073709552896",
        "8487535457886",
        "1791047679",
        "1791047699",
        "18446744073709552896"
      ]
    },
    {
      "id": "r163",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552895"
      ],
      "ok": true,
      "result": [
        "18446744073709552895",
        "8497443756243",
        "1790961271",
        "1790961287",
        "18446744073709552895"
      ]
    },
    {
      "id": "r164",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552894"
      ],
      "ok": true,
      "result": [
        "18446744073709552894",
        "8673926483371",
        "1790915409",
        "1790915423",
        "18446744073709552894"
      ]
    },
    {
      "id": "r165",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552893"
      ],
      "ok": true,
      "result": [
        "18446744073709552893",
        "8502099107764",
        "1790876812",
        "1790876831",
        "18446744073709552893"
      ]
    },
    {
      "id": "r166",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552892"
      ],
      "ok": true,
      "result": [
        "18446744073709552892",
        "8334101521913",
        "1790839566",
        "1790839583",
        "18446744073709552892"
      ]
    },
    {
      "id": "r167",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552891"
      ],
      "ok": true,
      "result": [
        "18446744073709552891",
        "8507160169334",
        "1790772577",
        "1790772599",
        "18446744073709552891"
      ]
    },
    {
      "id": "r168",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552890"
      ],
      "ok": true,
      "result": [
        "18446744073709552890",
        "8339936106343",
        "1790746465",
        "1790746487",
        "18446744073709552890"
      ]
    },
    {
      "id": "r169",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552889"
      ],
      "ok": true,
      "result": [
        "18446744073709552889",
        "8309874148503",
        "1790660038",
        "1790660051",
        "18446744073709552889"
      ]
    },
    {
      "id": "r170",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552888"
      ],
      "ok": true,
      "result": [
        "18446744073709552888",
        "8298423077136",
        "1790573613",
        "1790573627",
        "18446744073709552888"
      ]
    },
    {
      "id": "r171",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552887"
      ],
      "ok": true,
      "result": [
        "18446744073709552887",
        "8468891965564",
        "1790519378",
        "1790519399",
        "18446744073709552887"
      ]
    },
    {
      "id": "r172",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552886"
      ],
      "ok": true,
      "result": [
        "18446744073709552886",
        "8396409227524",
        "1790432968",
        "1790432987",
        "18446744073709552886"
      ]
    },
    {
      "id": "r173",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552885"
      ],
      "ok": true,
      "result": [
        "18446744073709552885",
        "8367032663738",
        "1790346560",
        "1790346575",
        "18446744073709552885"
      ]
    },
    {
      "id": "r174",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552884"
      ],
      "ok": true,
      "result": [
        "18446744073709552884",
        "8482754889285",
        "1790260149",
        "1790260163",
        "18446744073709552884"
      ]
    },
    {
      "id": "r175",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552883"
      ],
      "ok": true,
      "result": [
        "18446744073709552883",
        "8314355933650",
        "1790242272",
        "1790242295",
        "18446744073709552883"
      ]
    },
    {
      "id": "r176",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552882"
      ],
      "ok": true,
      "result": [
        "18446744073709552882",
        "8493392287424",
        "1790172699",
        "1790172719",
        "18446744073709552882"
      ]
    },
    {
      "id": "r177",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552881"
      ],
      "ok": true,
      "result": [
        "18446744073709552881",
        "8667651449170",
        "1790126370",
        "1790126387",
        "18446744073709552881"
      ]
    },
    {
      "id": "r178",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552880"
      ],
      "ok": true,
      "result": [
        "18446744073709552880",
        "8549395599949",
        "1790039955",
        "1790039975",
        "18446744073709552880"
      ]
    },
    {
      "id": "r179",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2665701293fCbEB223D11A08D826563EDcCE423A",
      "fn": "getRoundData(uint80)",
      "args": [
        "18446744073709552879"
      ],
      "ok": true,
      "result": [
        "18446744073709552879",
        "8727991990666",
        "1790022427",
        "1790022443",
        "18446744073709552879"
      ]
    },
    {
      "id": "r180",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x5e2420cACE3650622f62B2713B2B3727FC8bCDd1",
      "fn": "minAnswer()",
      "args": [],
      "ok": true,
      "result": "1"
    },
    {
      "id": "r181",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x5e2420cACE3650622f62B2713B2B3727FC8bCDd1",
      "fn": "maxAnswer()",
      "args": [],
      "ok": true,
      "result": "95780971304118053647396689196894323976171195136475135"
    },
    {
      "id": "r182",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "ok": true,
      "result": {
        "size": 170,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r183",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r184",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r185",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r186",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r187",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r188",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "fn": "owner()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"owner\" reverted."
    },
    {
      "id": "r189",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "fn": "getThreshold()",
      "args": [],
      "ok": true,
      "result": "4"
    },
    {
      "id": "r190",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "fn": "getOwners()",
      "args": [],
      "ok": true,
      "result": [
        "0x80eFDeE7F82d0F2aBF3bF29A9A85edF0B42C9e19",
        "0x05724B9C8C1dDE1b2f659d7c0676ff63f6d5E781",
        "0x480496c0884D61F2f56707Adb11697F8018898c2",
        "0xB65B6d224351cD61f856c227b2d5cFc611E9B2d8",
        "0x80D46daD5A5450a3611CD1d7F9110AEdFA55bfF6",
        "0xFdE996F00E42b33bdE7C640786333623aCC3f298",
        "0x7052cB84079905400ea52B635cAb6a275fDA8823",
        "0xb7F0643D4ca8c296564Ce335062833e1afa3Afdb",
        "0xD66336eA98cE0da67f25934E7cC230D4226292a0"
      ]
    },
    {
      "id": "r191",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "description()",
      "args": [],
      "ok": true,
      "result": "BTC / USD"
    },
    {
      "id": "r192",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "decimals()",
      "args": [],
      "ok": true,
      "result": 8
    },
    {
      "id": "r193",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "latestRoundData()",
      "args": [],
      "ok": true,
      "result": [
        "129127208515966886307",
        "8251735583226",
        "1791580958",
        "1791580979",
        "129127208515966886307"
      ]
    },
    {
      "id": "r194",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "aggregator()",
      "args": [],
      "ok": true,
      "result": "0x4a3411ac2948B33c69666B35cc6d055B27Ea84f1"
    },
    {
      "id": "r195",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "ok": true,
      "result": {
        "size": 9571,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r196",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r197",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r198",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r199",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r200",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r201",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "owner()",
      "args": [],
      "ok": true,
      "result": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA"
    },
    {
      "id": "r202",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886306"
      ],
      "ok": true,
      "result": [
        "129127208515966886306",
        "8240318100000",
        "1791577327",
        "1791577343",
        "129127208515966886306"
      ]
    },
    {
      "id": "r203",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886305"
      ],
      "ok": true,
      "result": [
        "129127208515966886305",
        "8242487117037",
        "1791573695",
        "1791573719",
        "129127208515966886305"
      ]
    },
    {
      "id": "r204",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886304"
      ],
      "ok": true,
      "result": [
        "129127208515966886304",
        "8252251513356",
        "1791570093",
        "1791570107",
        "129127208515966886304"
      ]
    },
    {
      "id": "r205",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886303"
      ],
      "ok": true,
      "result": [
        "129127208515966886303",
        "8259806723556",
        "1791566462",
        "1791566483",
        "129127208515966886303"
      ]
    },
    {
      "id": "r206",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886302"
      ],
      "ok": true,
      "result": [
        "129127208515966886302",
        "8281067230101",
        "1791562859",
        "1791562871",
        "129127208515966886302"
      ]
    },
    {
      "id": "r207",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886301"
      ],
      "ok": true,
      "result": [
        "129127208515966886301",
        "8283541189788",
        "1791559258",
        "1791559271",
        "129127208515966886301"
      ]
    },
    {
      "id": "r208",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886300"
      ],
      "ok": true,
      "result": [
        "129127208515966886300",
        "8303865800000",
        "1791555626",
        "1791555647",
        "129127208515966886300"
      ]
    },
    {
      "id": "r209",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886299"
      ],
      "ok": true,
      "result": [
        "129127208515966886299",
        "8258405042995",
        "1791552955",
        "1791552971",
        "129127208515966886299"
      ]
    },
    {
      "id": "r210",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886298"
      ],
      "ok": true,
      "result": [
        "129127208515966886298",
        "8303243000000",
        "1791550044",
        "1791550067",
        "129127208515966886298"
      ]
    },
    {
      "id": "r211",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886297"
      ],
      "ok": true,
      "result": [
        "129127208515966886297",
        "8337327503740",
        "1791546412",
        "1791546443",
        "129127208515966886297"
      ]
    },
    {
      "id": "r212",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886296"
      ],
      "ok": true,
      "result": [
        "129127208515966886296",
        "8292254785102",
        "1791545962",
        "1791545987",
        "129127208515966886296"
      ]
    },
    {
      "id": "r213",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886295"
      ],
      "ok": true,
      "result": [
        "129127208515966886295",
        "8250946324996",
        "1791543471",
        "1791543491",
        "129127208515966886295"
      ]
    },
    {
      "id": "r214",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886294"
      ],
      "ok": true,
      "result": [
        "129127208515966886294",
        "8259378868766",
        "1791539839",
        "1791539855",
        "129127208515966886294"
      ]
    },
    {
      "id": "r215",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886293"
      ],
      "ok": true,
      "result": [
        "129127208515966886293",
        "8260574799441",
        "1791536208",
        "1791536231",
        "129127208515966886293"
      ]
    },
    {
      "id": "r216",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886292"
      ],
      "ok": true,
      "result": [
        "129127208515966886292",
        "8253978000000",
        "1791532576",
        "1791532595",
        "129127208515966886292"
      ]
    },
    {
      "id": "r217",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886291"
      ],
      "ok": true,
      "result": [
        "129127208515966886291",
        "8250144900000",
        "1791528945",
        "1791528959",
        "129127208515966886291"
      ]
    },
    {
      "id": "r218",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886290"
      ],
      "ok": true,
      "result": [
        "129127208515966886290",
        "8228220478680",
        "1791525313",
        "1791525335",
        "129127208515966886290"
      ]
    },
    {
      "id": "r219",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886289"
      ],
      "ok": true,
      "result": [
        "129127208515966886289",
        "8218971634568",
        "1791521681",
        "1791521699",
        "129127208515966886289"
      ]
    },
    {
      "id": "r220",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886288"
      ],
      "ok": true,
      "result": [
        "129127208515966886288",
        "8231595673012",
        "1791518063",
        "1791518087",
        "129127208515966886288"
      ]
    },
    {
      "id": "r221",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886287"
      ],
      "ok": true,
      "result": [
        "129127208515966886287",
        "8227812677000",
        "1791514461",
        "1791514475",
        "129127208515966886287"
      ]
    },
    {
      "id": "r222",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886286"
      ],
      "ok": true,
      "result": [
        "129127208515966886286",
        "8186816553279",
        "1791513050",
        "1791513071",
        "129127208515966886286"
      ]
    },
    {
      "id": "r223",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886285"
      ],
      "ok": true,
      "result": [
        "129127208515966886285",
        "8173725072619",
        "1791509448",
        "1791509459",
        "129127208515966886285"
      ]
    },
    {
      "id": "r224",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886284"
      ],
      "ok": true,
      "result": [
        "129127208515966886284",
        "8168944070735",
        "1791505847",
        "1791505859",
        "129127208515966886284"
      ]
    },
    {
      "id": "r225",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      "fn": "getRoundData(uint80)",
      "args": [
        "129127208515966886283"
      ],
      "ok": true,
      "result": [
        "129127208515966886283",
        "8177570899899",
        "1791502215",
        "1791502235",
        "129127208515966886283"
      ]
    },
    {
      "id": "r226",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x4a3411ac2948B33c69666B35cc6d055B27Ea84f1",
      "fn": "minAnswer()",
      "args": [],
      "ok": true,
      "result": "1"
    },
    {
      "id": "r227",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x4a3411ac2948B33c69666B35cc6d055B27Ea84f1",
      "fn": "maxAnswer()",
      "args": [],
      "ok": true,
      "result": "95780971304118053647396689196894323976171195136475135"
    },
    {
      "id": "r228",
      "block": "26157638",
      "method": "eth_getCode",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "ok": true,
      "result": {
        "size": 170,
        "prefix": "0x60806040"
      }
    },
    {
      "id": "r229",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "args": [
        "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r230",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "args": [
        "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r231",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "args": [
        "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r232",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "args": [
        "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r233",
      "block": "26157638",
      "method": "eth_getStorageAt",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "args": [
        "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b"
      ],
      "ok": true,
      "result": "0x0000000000000000000000000000000000000000000000000000000000000000"
    },
    {
      "id": "r234",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "fn": "owner()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"owner\" reverted."
    },
    {
      "id": "r235",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "fn": "getThreshold()",
      "args": [],
      "ok": true,
      "result": "4"
    },
    {
      "id": "r236",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x21f73D42Eb58Ba49dDB685dc29D3bF5c0f0373CA",
      "fn": "getOwners()",
      "args": [],
      "ok": true,
      "result": [
        "0x80eFDeE7F82d0F2aBF3bF29A9A85edF0B42C9e19",
        "0x05724B9C8C1dDE1b2f659d7c0676ff63f6d5E781",
        "0x480496c0884D61F2f56707Adb11697F8018898c2",
        "0xB65B6d224351cD61f856c227b2d5cFc611E9B2d8",
        "0x80D46daD5A5450a3611CD1d7F9110AEdFA55bfF6",
        "0xFdE996F00E42b33bdE7C640786333623aCC3f298",
        "0x7052cB84079905400ea52B635cAb6a275fDA8823",
        "0xb7F0643D4ca8c296564Ce335062833e1afa3Afdb",
        "0xD66336eA98cE0da67f25934E7cC230D4226292a0"
      ]
    },
    {
      "id": "r237",
      "block": "26157638",
      "method": "offchain-candidates",
      "fn": "morpho-api",
      "args": [
        "{ vaultPositions(first: 25, orderBy: Shares, orderDirection: Desc, where:{vaultAddress_in:[\"0x812B2C6Ab3f4471c0E43D4BB61098a9211017427\"], chainId_in:[1]}) { items { user { address } } } }"
      ],
      "ok": true,
      "result": {
        "fetchedAt": "2026-10-10T12:39:32.142Z",
        "resultCount": 25
      }
    },
    {
      "id": "r238",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcA11bde05977b3631167028862bE2a173976CA11",
      "fn": "aggregate3 x25 balanceOf(address)",
      "args": [
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x2C24B57e2CCd1f273045Af6A5f632504C432374F"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x02cc00667f1B5c30e5FeeDA32331CA2e01A37318"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0xd3B6d50C64a1729595b92243Fe9d222cb35638B6"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0xC55bDCA87a66d6F87C673d38A2cF4D9e50AA280A"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x34702F5F789196A723B8DF6334922f145A7db1b2"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0xf200EF1DAd3d0cEE48380F860e61362B4f1eb96B"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x52EAF3F04cbac0a4B9878A75AB2523722325D4D4"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0xDD8cC9d9Aa7dBD8e897341F394299285255d5650"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0xE01dddFB490726df1Fc3A62aB627F05ce673c586"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0xF463463Da89164292d41fEe1781b5F1BD543afB9"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x22ed9e1FF9538f01976be7425CC3b070c8e7Ecaf"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x22B11b23E0E773d3F7C9a68340484b9486105D74"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0xdC7762656C49419AB45D97384bF85E05F3e26524"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0xA810d77016C842C15b39B5E40Ffc5e00FA9CD5a6"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x1121aFF29666B91181568264Ab0F2Bc58Bf90a11"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x9ee3Cab99e98779510589de324E0A511AE4e5ad7"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x0f07C26023f08f271B1566c852f685Ab17686A90"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x6bD2DeFa6fDc4D3b90DA690A7987b0bEC6BF6d95"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x000000000000000000000000000000000000dEaD"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0xC2780996936211D912f16048f7DCD0e0A91d6904"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x000000000004444c5dc75cB358380D2e3dE08A90"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x2D22414C5a37Fff7D41e715a87BFa1Afda77b8ca"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x023D630dea49bDC895b14028700594Db20ba1D2d"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x0424ece0EA139F2df634fe5EB97a2c8A49289596"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0x100CCe7e1E64aB144dEd54ba54e33eb40A1917dC"
          ]
        }
      ],
      "ok": true,
      "result": [
        "185894101368804724214",
        "140205540770960390",
        "9897335488667031",
        "1480968937308374",
        "396207500264986",
        "152532645747554",
        "150373951165144",
        "111552099898408",
        "100259801175706",
        "99984334988518",
        "99974940400479",
        "15995217539826",
        "9172251943035",
        "6998650233613",
        "4737914104465",
        "2838762513370",
        "2638869874620",
        "1437277298651",
        "1000000000000",
        "767662060321",
        "514156946067",
        "10",
        "0",
        "0",
        "0"
      ]
    },
    {
      "id": "r239",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcA11bde05977b3631167028862bE2a173976CA11",
      "fn": "aggregate3 x25 convertToAssets(uint256)",
      "args": [
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "185894101368804724214"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "140205540770960390"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "9897335488667031"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "1480968937308374"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "396207500264986"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "152532645747554"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "150373951165144"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "111552099898408"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "100259801175706"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "99984334988518"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "99974940400479"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "15995217539826"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "9172251943035"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "6998650233613"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "4737914104465"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "2838762513370"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "2638869874620"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "1437277298651"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "1000000000000"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "767662060321"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "514156946067"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "10"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0"
          ]
        },
        {
          "to": "0x812B2C6Ab3f4471c0E43D4BB61098a9211017427",
          "args": [
            "0"
          ]
        }
      ],
      "ok": true,
      "result": [
        "18597594621",
        "14026727",
        "990169",
        "148162",
        "39638",
        "15259",
        "15044",
        "11160",
        "10030",
        "10002",
        "10001",
        "1600",
        "917",
        "700",
        "474",
        "284",
        "264",
        "143",
        "100",
        "76",
        "51",
        "0",
        "0",
        "0",
        "0"
      ]
    },
    {
      "id": "r240",
      "block": "26157638",
      "method": "offchain-candidates",
      "fn": "morpho-api",
      "args": [
        "{ markets(first: 100, where:{uniqueKey_in:[\"0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf\",\"0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f\"], chainId_in:[1]}) { items { marketId supplyingVaults { address } } } }"
      ],
      "ok": true,
      "result": {
        "fetchedAt": "2026-10-10T12:39:33.469Z",
        "resultCount": 2
      }
    },
    {
      "id": "r241",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcA11bde05977b3631167028862bE2a173976CA11",
      "fn": "aggregate3 x1 isMetaMorpho(address)",
      "args": [
        {
          "to": "0xA9c3D3a366466Fa809d1Ae982Fb2c46E5fC41101",
          "args": [
            "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2"
          ]
        }
      ],
      "ok": true,
      "result": [
        true
      ]
    },
    {
      "id": "r242",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcA11bde05977b3631167028862bE2a173976CA11",
      "fn": "aggregate3 x1 isMetaMorpho(address)",
      "args": [
        {
          "to": "0x1897A8997241C1cD4bD0698647e4EB7213535c24",
          "args": [
            "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2"
          ]
        }
      ],
      "ok": true,
      "result": [
        false
      ]
    },
    {
      "id": "r243",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcA11bde05977b3631167028862bE2a173976CA11",
      "fn": "aggregate3 x2 position(bytes32,address)",
      "args": [
        {
          "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
          "args": [
            "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
            "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2"
          ]
        },
        {
          "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
          "args": [
            "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
            "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2"
          ]
        }
      ],
      "ok": true,
      "result": [
        [
          "2813375381000000",
          "0",
          "0"
        ],
        [
          "0",
          "0",
          "0"
        ]
      ]
    },
    {
      "id": "r244",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
      "fn": "name()",
      "args": [],
      "ok": true,
      "result": "Gauntlet WBTC Core"
    },
    {
      "id": "r245",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
      "fn": "totalAssets()",
      "args": [],
      "ok": true,
      "result": "2949934474"
    },
    {
      "id": "r246",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
      "fn": "withdrawQueueLength()",
      "args": [],
      "ok": true,
      "result": "2"
    },
    {
      "id": "r247",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcA11bde05977b3631167028862bE2a173976CA11",
      "fn": "aggregate3 x2 withdrawQueue(uint256)",
      "args": [
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "0"
          ]
        },
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "1"
          ]
        }
      ],
      "ok": true,
      "result": [
        "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf",
        "0xce68c7aa336675e42bbc8eaa8b5ecc7ebd816bf8625b5316330c6ac2dabc4cf2"
      ]
    },
    {
      "id": "r248",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xA9c3D3a366466Fa809d1Ae982Fb2c46E5fC41101",
      "fn": "isMetaMorpho(address)",
      "args": [
        "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2"
      ],
      "ok": true,
      "result": true
    },
    {
      "id": "r249",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
      "fn": "isAllocator(address)",
      "args": [
        "0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D"
      ],
      "ok": true,
      "result": true
    },
    {
      "id": "r250",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D",
      "fn": "flowCaps(address,bytes32)",
      "args": [
        "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
        "0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf"
      ],
      "ok": true,
      "result": [
        "0",
        "0"
      ]
    },
    {
      "id": "r251",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D",
      "fn": "flowCaps(address,bytes32)",
      "args": [
        "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
        "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f"
      ],
      "ok": true,
      "result": [
        "0",
        "0"
      ]
    },
    {
      "id": "r252",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
      "fn": "totalSupply()",
      "args": [],
      "ok": true,
      "result": "29067572704317568258"
    },
    {
      "id": "r253",
      "block": "26157638",
      "method": "offchain-candidates",
      "fn": "morpho-api",
      "args": [
        "{ vaultPositions(first: 5, orderBy: Shares, orderDirection: Desc, where:{vaultAddress_in:[\"0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2\"], chainId_in:[1]}) { items { user { address } } } }"
      ],
      "ok": true,
      "result": {
        "fetchedAt": "2026-10-10T12:39:34.280Z",
        "resultCount": 5
      }
    },
    {
      "id": "r254",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcA11bde05977b3631167028862bE2a173976CA11",
      "fn": "aggregate3 x5 balanceOf(address)",
      "args": [
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "0x2E15D7AA0650dE1009710FDd45C3468d75AE1392"
          ]
        },
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "0xa96060B0B6907406EdBDf3cCc9438abf0F78Cf83"
          ]
        },
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "0xBf9c95d4C2cf3A38c9C532835A84C78B98a03278"
          ]
        },
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "0xDDC2DB39E9518d744976ac02e597c9e62D2012Ff"
          ]
        },
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "0x4c324B422b7a3b352155efbbd4e783672723eAfa"
          ]
        }
      ],
      "ok": true,
      "result": [
        "9978203165238499142",
        "9897441507179234185",
        "1192255414659023981",
        "1048362225968396266",
        "1035371969387568193"
      ]
    },
    {
      "id": "r255",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcA11bde05977b3631167028862bE2a173976CA11",
      "fn": "aggregate3 x5 convertToAssets(uint256)",
      "args": [
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "9978203165238499142"
          ]
        },
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "9897441507179234185"
          ]
        },
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "1192255414659023981"
          ]
        },
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "1048362225968396266"
          ]
        },
        {
          "to": "0x443df5eEE3196e9b2Dd77CaBd3eA76C3dee8f9b2",
          "args": [
            "1035371969387568193"
          ]
        }
      ],
      "ok": true,
      "result": [
        "1012641998",
        "1004445868",
        "120996524",
        "106393466",
        "105075144"
      ]
    },
    {
      "id": "r256",
      "block": "26157638",
      "method": "offchain-candidates",
      "fn": "morpho-api",
      "args": [
        "{ marketPositions(first: 500, skip: 0, where:{marketUniqueKey_in:[\"0xa36e440fbc54d7ed744ae4895b2729642a8be5d488cdd477c59b54afbb90b5bf\"], chainId_in:[1], borrowShares_gte: \"1\"}) { pageInfo { countTotal count } items { user { address } } } }"
      ],
      "ok": true,
      "result": {
        "fetchedAt": "2026-10-10T12:39:35.009Z",
        "resultCount": 0
      }
    },
    {
      "id": "r257",
      "block": "26157638",
      "method": "offchain-candidates",
      "fn": "morpho-api",
      "args": [
        "{ marketPositions(first: 500, skip: 0, where:{marketUniqueKey_in:[\"0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f\"], chainId_in:[1], borrowShares_gte: \"1\"}) { pageInfo { countTotal count } items { user { address } } } }"
      ],
      "ok": true,
      "result": {
        "fetchedAt": "2026-10-10T12:39:35.558Z",
        "resultCount": 1
      }
    },
    {
      "id": "r258",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcA11bde05977b3631167028862bE2a173976CA11",
      "fn": "aggregate3 x1 position(bytes32,address)",
      "args": [
        {
          "to": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
          "args": [
            "0xab04bdfbeef6de62e3020d44710d6461eccfb901b9659f866844805fca115f2f",
            "0xB47f11484e19f1914D32fd393b17671221C10F1F"
          ]
        }
      ],
      "ok": true,
      "result": [
        [
          "1000000000",
          "900000000",
          "1500"
        ]
      ]
    },
    {
      "id": "r259",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "fn": "stETH()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"stETH\" reverted."
    },
    {
      "id": "r260",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        100
      ],
      "ok": true,
      "result": "0xe8f7c89C5eFa061e340f2d2F206EC78FD8f7e124"
    },
    {
      "id": "r261",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        500
      ],
      "ok": true,
      "result": "0x0da6253560822973185297d5f32fF8fA38243Afe"
    },
    {
      "id": "r262",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        3000
      ],
      "ok": true,
      "result": "0x3b04AC887795b2251E591d7636640d928a74408c"
    },
    {
      "id": "r263",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        10000
      ],
      "ok": true,
      "result": "0x2853486bB3B9763Eb8a109FaB33f5E08232eA7d5"
    },
    {
      "id": "r264",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC",
      "fn": "find_pools_for_coins(address,address)",
      "args": [
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
      ],
      "ok": true,
      "result": [
        "0x839d6bDeDFF886404A6d7a788ef241e4e28F4802",
        "0x8e5dC7bF5677142EB2ABa4bcFb1e5DCFD6C8a613",
        "0x6C49C560cdCB33d991B089F8237e8175564Ff567",
        "0x66039342C66760874047c36943B1e2d8300363BB",
        "0xDB1b3CB8731577E5fDCCDb9Ade10996CDa64dF68",
        "0x0043d16C636B43Db2Db46df6Bb3d47051041Be3F"
      ]
    },
    {
      "id": "r265",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC",
      "fn": "get_coin_indices(address,address,address)",
      "args": [
        "0x839d6bDeDFF886404A6d7a788ef241e4e28F4802",
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
      ],
      "ok": true,
      "result": [
        "0",
        "1",
        false
      ]
    },
    {
      "id": "r266",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC",
      "fn": "get_coin_indices(address,address,address)",
      "args": [
        "0x8e5dC7bF5677142EB2ABa4bcFb1e5DCFD6C8a613",
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
      ],
      "ok": true,
      "result": [
        "1",
        "2",
        false
      ]
    },
    {
      "id": "r267",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC",
      "fn": "get_coin_indices(address,address,address)",
      "args": [
        "0x6C49C560cdCB33d991B089F8237e8175564Ff567",
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
      ],
      "ok": true,
      "result": [
        "1",
        "2",
        false
      ]
    },
    {
      "id": "r268",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC",
      "fn": "get_coin_indices(address,address,address)",
      "args": [
        "0x66039342C66760874047c36943B1e2d8300363BB",
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
      ],
      "ok": true,
      "result": [
        "1",
        "0",
        false
      ]
    },
    {
      "id": "r269",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC",
      "fn": "get_coin_indices(address,address,address)",
      "args": [
        "0xDB1b3CB8731577E5fDCCDb9Ade10996CDa64dF68",
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
      ],
      "ok": true,
      "result": [
        "2",
        "0",
        false
      ]
    },
    {
      "id": "r270",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC",
      "fn": "get_coin_indices(address,address,address)",
      "args": [
        "0x0043d16C636B43Db2Db46df6Bb3d47051041Be3F",
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"
      ],
      "ok": true,
      "result": [
        "0",
        "1",
        false
      ]
    },
    {
      "id": "r271",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        100
      ],
      "ok": true,
      "result": "0xe6ff8b9A37B0fab776134636D9981Aa778c4e718"
    },
    {
      "id": "r272",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
      "fn": "quoteExactInputSingle(tuple)",
      "args": [
        {
          "tokenIn": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          "tokenOut": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "amountIn": "100000000000000000000",
          "fee": 100,
          "sqrtPriceLimitX96": "0"
        }
      ],
      "ok": true,
      "result": [
        "299889746",
        "45751094486754290113288266435492374",
        1,
        "121280"
      ]
    },
    {
      "id": "r273",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        500
      ],
      "ok": true,
      "result": "0x4585FE77225b41b697C938B018E2Ac67Ac5a20c0"
    },
    {
      "id": "r274",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
      "fn": "quoteExactInputSingle(tuple)",
      "args": [
        {
          "tokenIn": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          "tokenOut": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "amountIn": "100000000000000000000",
          "fee": 500,
          "sqrtPriceLimitX96": "0"
        }
      ],
      "ok": true,
      "result": [
        "301218897",
        "45639332041098285441920974841777279",
        1,
        "91137"
      ]
    },
    {
      "id": "r275",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        3000
      ],
      "ok": true,
      "result": "0xCBCdF9626bC03E24f779434178A73a0B4bad62eD"
    },
    {
      "id": "r276",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
      "fn": "quoteExactInputSingle(tuple)",
      "args": [
        {
          "tokenIn": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          "tokenOut": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "amountIn": "100000000000000000000",
          "fee": 3000,
          "sqrtPriceLimitX96": "0"
        }
      ],
      "ok": true,
      "result": [
        "298266205",
        "45963327930959674859327862236554517",
        3,
        "144408"
      ]
    },
    {
      "id": "r277",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        10000
      ],
      "ok": true,
      "result": "0x6Ab3bba2F41e7eAA262fa5A1A9b3932fA161526F"
    },
    {
      "id": "r278",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x61fFE014bA17989E743c5F6cB21bF9697530B21e",
      "fn": "quoteExactInputSingle(tuple)",
      "args": [
        {
          "tokenIn": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          "tokenOut": "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          "amountIn": "100000000000000000000",
          "fee": 10000,
          "sqrtPriceLimitX96": "0"
        }
      ],
      "ok": true,
      "result": [
        "9772860",
        "159205105332843372285410279831992259974",
        13,
        "669096"
      ]
    },
    {
      "id": "r279",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
      "fn": "stETH()",
      "args": [],
      "ok": false,
      "result": "revert/absent: The contract function \"stETH\" reverted."
    },
    {
      "id": "r280",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        100
      ],
      "ok": true,
      "result": "0x66Bb2eCF89C92a11044a46411d0c9E0BC9E31340"
    },
    {
      "id": "r281",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        500
      ],
      "ok": true,
      "result": "0x66DD1ACc5da42502ddD469277aed509D1de22b69"
    },
    {
      "id": "r282",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        3000
      ],
      "ok": true,
      "result": "0x15aA01580ae866f9FF4DBe45E06e307941d90C7b"
    },
    {
      "id": "r283",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      "fn": "getPool(address,address,uint24)",
      "args": [
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        10000
      ],
      "ok": true,
      "result": "0xce1790BB9f2327525d5e99B2C2b92EB5a486c6f8"
    },
    {
      "id": "r284",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC",
      "fn": "find_pools_for_coins(address,address)",
      "args": [
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      ],
      "ok": true,
      "result": [
        "0x8a4f252812dFF2A8636E4F7EB249d8FC2E3bd77f"
      ]
    },
    {
      "id": "r285",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xF98B45FA17DE75FB1aD0e7aFD971b0ca00e379fC",
      "fn": "get_coin_indices(address,address,address)",
      "args": [
        "0x8a4f252812dFF2A8636E4F7EB249d8FC2E3bd77f",
        "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf",
        "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
      ],
      "ok": true,
      "result": [
        "1",
        "2",
        false
      ]
    },
    {
      "id": "r286",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xe8f7c89C5eFa061e340f2d2F206EC78FD8f7e124",
      "fn": "quote series (7 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Uniswap V3 0.01% pool",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "100000000",
        "avgPrice": 1.00128737
      }
    },
    {
      "id": "r287",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x0da6253560822973185297d5f32fF8fA38243Afe",
      "fn": "quote series (7 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Uniswap V3 0.05% pool",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "100000000",
        "avgPrice": 1.0000731
      }
    },
    {
      "id": "r288",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x3b04AC887795b2251E591d7636640d928a74408c",
      "fn": "quote series (1 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Uniswap V3 0.3% pool",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "0",
        "avgPrice": null
      }
    },
    {
      "id": "r289",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x2853486bB3B9763Eb8a109FaB33f5E08232eA7d5",
      "fn": "quote series (1 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Uniswap V3 1% pool",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "0",
        "avgPrice": null
      }
    },
    {
      "id": "r290",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x839d6bDeDFF886404A6d7a788ef241e4e28F4802",
      "fn": "quote series (7 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Curve pool 0x839d6b…",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "100000000",
        "avgPrice": 1.00096806
      }
    },
    {
      "id": "r291",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x8e5dC7bF5677142EB2ABa4bcFb1e5DCFD6C8a613",
      "fn": "quote series (1 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Curve pool 0x8e5dC7…",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "0",
        "avgPrice": null
      }
    },
    {
      "id": "r292",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x6C49C560cdCB33d991B089F8237e8175564Ff567",
      "fn": "quote series (1 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Curve pool 0x6C49C5…",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "0",
        "avgPrice": null
      }
    },
    {
      "id": "r293",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x66039342C66760874047c36943B1e2d8300363BB",
      "fn": "quote series (7 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Curve pool 0x660393…",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "100000000",
        "avgPrice": 1.00047591
      }
    },
    {
      "id": "r294",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xDB1b3CB8731577E5fDCCDb9Ade10996CDa64dF68",
      "fn": "quote series (1 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Curve pool 0xDB1b3C…",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "0",
        "avgPrice": null
      }
    },
    {
      "id": "r295",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x0043d16C636B43Db2Db46df6Bb3d47051041Be3F",
      "fn": "quote series (1 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Curve pool 0x0043d1…",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "0",
        "avgPrice": null
      }
    },
    {
      "id": "r296",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x66Bb2eCF89C92a11044a46411d0c9E0BC9E31340",
      "fn": "quote series (1 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Uniswap V3 0.01% pool → WETH → Uniswap V3 0.05% pool",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "0",
        "avgPrice": null
      }
    },
    {
      "id": "r297",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x66DD1ACc5da42502ddD469277aed509D1de22b69",
      "fn": "quote series (1 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Uniswap V3 0.05% pool → WETH → Uniswap V3 0.05% pool",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "0",
        "avgPrice": null
      }
    },
    {
      "id": "r298",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x15aA01580ae866f9FF4DBe45E06e307941d90C7b",
      "fn": "quote series (14 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Uniswap V3 0.3% pool → WETH → Uniswap V3 0.05% pool",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "63962500",
        "avgPrice": 0.983507070549
      }
    },
    {
      "id": "r299",
      "block": "26157638",
      "method": "eth_call",
      "to": "0xce1790BB9f2327525d5e99B2C2b92EB5a486c6f8",
      "fn": "quote series (1 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Uniswap V3 1% pool → WETH → Uniswap V3 0.05% pool",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "0",
        "avgPrice": null
      }
    },
    {
      "id": "r300",
      "block": "26157638",
      "method": "eth_call",
      "to": "0x8a4f252812dFF2A8636E4F7EB249d8FC2E3bd77f",
      "fn": "quote series (9 quotes: Uniswap V3 QuoterV2 / Curve get_dy) for Curve pool 0x8a4f25… → WETH → Uniswap V3 0.05% pool",
      "args": [
        {
          "threshold": "proceeds >= amount * oraclePrice / LIF",
          "lltv": "945000000000000000"
        }
      ],
      "ok": true,
      "result": {
        "capacity": "5800000",
        "avgPrice": 0.983506551724
      }
    }
  ],
  "notes": [
    "All values are eth_call / eth_getStorageAt / eth_getLogs reads at the frozen block through the local proxy; every node and edge lists the read ids it rests on.",
    "Market totals are the stored values at the block (interest accrued up to lastUpdate); MetaMorpho's maxWithdraw adds interest accrued since, hence tiny differences.",
    "Allocators other than the Public Allocator are not enumerated (would need SetIsAllocator event history)."
  ]
};
