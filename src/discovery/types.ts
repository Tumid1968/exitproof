import type { Address, Hex } from "viem";
import type { ReadRecord } from "./reader.ts";

export type NodeKind =
  | "chain" | "vault" | "market" | "token" | "yieldSource" | "oracle" | "feed" | "aggregator"
  | "irm" | "governance" | "allocator" | "peerVault" | "borrowers" | "holders" | "dex";

export type GraphNode = {
  id: string;
  kind: NodeKind;
  layer: number;
  label: string;
  address?: Address;
  data: Record<string, unknown>;
  /** ids of the ReadRecords this node's data comes from */
  prov: string[];
};

export type GraphEdge = {
  from: string;
  to: string;
  rel: string;
  data?: Record<string, unknown>;
  prov: string[];
};

export type MarketParams = {
  loanToken: Address; collateralToken: Address; oracle: Address; irm: Address; lltv: bigint;
};

export type MarketState = {
  id: Hex;
  queueIndex: number;
  params: MarketParams;
  totalSupplyAssets: bigint; totalSupplyShares: bigint;
  totalBorrowAssets: bigint; totalBorrowShares: bigint;
  lastUpdate: bigint; fee: bigint;
  vaultSupplyShares: bigint; vaultSupplyAssets: bigint;
  liquidity: bigint;
  vaultWithdrawable: bigint;
  utilization: number;
  borrowApr: number | null;
  supplyApr: number | null;
  cap: bigint;
  collateralSymbol: string;
  collateralDecimals: number;
  loanDecimals: number;
  oraclePrice: bigint | null;
};

export type Borrower = { address: Address; borrowShares: bigint; collateral: bigint; debt: bigint; ltv: number | null };

export type Holder = { address: Address; shares: bigint; assets: bigint; shareOfSupply: number; isContract: boolean };

export type PeerExposure = {
  vault: Address; name: string; version: string; totalAssets: bigint;
  topHolder: Holder | null;
  markets: { id: Hex; supplyAssets: bigint; queueIndex: number | null }[];
  publicAllocator: { enabled: boolean; flowCaps: { id: Hex; maxIn: bigint; maxOut: bigint }[]; reallocatableIn: { id: Hex; amount: bigint }[] };
};

export type DependencyGraph = {
  schema: "exitproof.graph/0.1";
  source: { chainId: number; block: string; blockHash: Hex; timestamp: string; baseFeePerGas: string | null };
  target: { vault: Address; name: string; version: string; asset: Address; assetSymbol: string; assetDecimals: number };
  summary: Record<string, unknown>;
  markets: MarketState[];
  peers: PeerExposure[];
  holders: { coverage: number; list: Holder[] };
  /** AMM exit capacity for liquidators, per exposed market (collateral smallest units) */
  dex: Record<string, { capacity: bigint; collateralAtRisk: bigint; venues: { id: string; route: string; pool: Address; capacity: bigint; avgPrice: number | null }[] }>;
  borrowers: Record<string, { coverage: number; count: number; list: Borrower[] }>;
  nodes: GraphNode[];
  edges: GraphEdge[];
  reads: ReadRecord[];
  notes: string[];
};
