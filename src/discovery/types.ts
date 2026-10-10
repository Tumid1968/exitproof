import type { Address, Hex } from "viem";
import type { ReadRecord } from "./reader.ts";

export type NodeKind =
  | "chain" | "vault" | "market" | "token" | "yieldSource" | "oracle" | "feed" | "aggregator"
  | "irm" | "governance" | "allocator" | "peerVault" | "borrowers";

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

export type PeerExposure = {
  vault: Address; name: string; version: string; totalAssets: bigint;
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
  borrowers: Record<string, { coverage: number; count: number; list: Borrower[] }>;
  nodes: GraphNode[];
  edges: GraphEdge[];
  reads: ReadRecord[];
  notes: string[];
};
