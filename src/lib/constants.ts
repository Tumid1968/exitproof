import type { Address, Hex } from "viem";

/** Frozen source state. Everything ExitProof shows is read at, or simulated from, this block. */
export const SOURCE = {
  chainId: 1,
  block: 26_157_638n,
  blockHash: "0x3e8450286456e913f08f2290aa3eac5e0c8b6d5be51bef3955032d9c43977bf4" as Hex,
  timestamp: 1_791_582_443n,
} as const;

/** Seconds added per transaction rank k in a branch: tx k is mined at T0 + STEP * k. */
export const TIMESTAMP_STEP = 12n;

export const PROXY_URL = process.env.EXITPROOF_PROXY_URL ?? "http://127.0.0.1:8600";
export const NODE_URL = process.env.EXITPROOF_NODE_URL ?? "http://127.0.0.1:8545";

export const ADDR = {
  morphoBlue: "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
  metaMorphoFactoryV1_0: "0xA9c3D3a366466Fa809d1Ae982Fb2c46E5fC41101",
  metaMorphoFactoryV1_1: "0x1897A8997241C1cD4bD0698647e4EB7213535c24",
  publicAllocator: "0xfd32fA2ca22c76dD6E550706Ad913FC6CE91c75D",
  weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  wstETH: "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0",
  multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11",
} as const satisfies Record<string, Address>;

/** Demo actors (real holders at the source block; impersonated locally = scenario hypothesis). */
export const ACTORS = {
  steakhouseEth: "0xBEEf050ecd6a16c4e7bfFbB52Ebba7846C4b8cD4",
  gauntletWethPrime: "0x2371e134e3455e0593363cBF89d3b6cf53740618",
  vaultBridgeWeth: "0x31A5684983EeE865d943A696AAC155363bA024f9",
  A: "0x27F23c710dD3d878FE9393d93465FeD1302f2EbD",
  B: "0x9fC3dc011b461664c835F2527fffb1169b3C213e",
  C: "0x5EC6abfF9BB4c673f63D077a962A29945f744857",
  D: "0x5a91cE2E8E201aaDe717246F04f9618A58eF9931",
  VB1: "0x80845058350B8c3Df5c3015d8a717D64B3bF9267",
} as const satisfies Record<string, Address>;
