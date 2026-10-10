/**
 * Dependency discovery for a MetaMorpho V1 vault at the frozen block.
 *
 * Layers walked (each link is backed by a recorded on-chain read):
 *   0 settlement chain -> 1 vault (+ governance, allocators) -> 2 Morpho Blue markets of the withdraw queue
 *   -> 3 oracle, IRM, collateral token -> 4 price feeds / exchange-rate adapters, yield source / custody admin
 *   -> 5 aggregators behind feeds ; plus peer vaults lending in the same markets and the borrowers of each market.
 */
import { getAddress, zeroAddress, type Address, type Hex } from "viem";
import { borrowerCandidates, holderCandidates, supplyingVaultCandidates } from "./morphoApi.ts";
import { discoverVenues, venueCapacity, type Venue } from "./dex.ts";
import { lifWad } from "../shocks/analytic.ts";
import { Reader } from "./reader.ts";
import {
  chainlinkFeedAbi, collateralProbeAbi, erc20Abi, factoryAbi, irmAbi, metaMorphoAbi, morphoBlueAbi,
  morphoOracleAbi, oracleRouterAbi, publicAllocatorAbi, safeAbi,
} from "../lib/abis.ts";
import { ADDR, SOURCE } from "../lib/constants.ts";
import { pmap, toAssetsDown, toAssetsUp } from "../lib/util.ts";
import type { Borrower, Holder, DependencyGraph, GraphEdge, GraphNode, MarketParams, MarketState, PeerExposure } from "./types.ts";

const SECONDS_PER_YEAR = 31_536_000;
const SLOTS = {
  eip1967Impl: "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc",
  eip1967Admin: "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103",
  eip1967Beacon: "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50",
  zosImpl: "0x7050c9e0f4ca769c69bd3a8ef740bc37934f8e2c036e5a723fd8ee048ed3f8c3",
  zosAdmin: "0x10d6a54a4754c8869d6886b5f5d7fbfa5b4522237ea5c60d11bc4e7a1ff9390b",
} as const satisfies Record<string, Hex>;

const slotAddr = (v: Hex): Address | null => {
  const a = "0x" + v.slice(-40);
  return BigInt(v) === 0n ? null : getAddress(a);
};

export type DiscoverOptions = { peers?: boolean; borrowers?: boolean; dex?: boolean; log?: (s: string) => void };

export async function discover(vaultIn: Address, opts: DiscoverOptions = {}): Promise<DependencyGraph> {
  const log = opts.log ?? (() => {});
  const r = new Reader();
  const vault = getAddress(vaultIn);
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  const notes: string[] = [];
  const addNode = (n: GraphNode) => {
    const prev = nodes.get(n.id);
    if (prev) { prev.prov.push(...n.prov); Object.assign(prev.data, n.data); return prev; }
    nodes.set(n.id, n);
    return n;
  };
  const addEdge = (e: GraphEdge) => edges.push(e);

  // ---------- Layer 0: settlement chain ----------
  const [hdr, hdrId] = await r.blockHeader();
  if (hdr.hash !== SOURCE.blockHash) throw new Error(`block hash mismatch: ${hdr.hash}`);
  addNode({
    id: "chain:1", kind: "chain", layer: 0, label: "Ethereum mainnet (chainId 1)",
    data: { block: hdr.number, hash: hdr.hash, timestamp: hdr.timestamp, baseFeePerGas: hdr.baseFeePerGas, settlement: "Ethereum L1 consensus; archive RPC used for reads" },
    prov: [hdrId],
  });

  /** Code size, proxy slots, owner(): who can change this contract. */
  async function profile(addr: Address) {
    const prov: string[] = [];
    const [size, cId, code] = await r.codeSize(addr); prov.push(cId);
    const data: Record<string, unknown> = { codeSize: size, isContract: size > 0 };
    // EIP-1167 minimal proxy: implementation is hard-coded in the bytecode (immutable clone)
    if (size === 45 && code.toLowerCase().startsWith("0x363d3d373d3d3d363d73")) data.eip1167Implementation = getAddress("0x" + code.slice(22, 62));
    if (size === 0) return { data, prov, admin: null as Address | null, impl: null as Address | null };
    let impl: Address | null = null; let admin: Address | null = null;
    for (const [k, slot] of Object.entries(SLOTS)) {
      const [v, id] = await r.storage(addr, slot);
      const a = slotAddr(v);
      if (a) { prov.push(id); data[k] = a; if (k.endsWith("Impl")) impl = a; if (k.endsWith("Admin")) admin = a; }
    }
    const [own, oId] = await r.call<Address>(addr, collateralProbeAbi, "owner");
    if (own) { prov.push(oId); data.owner = own; }
    return { data, prov, admin, impl, owner: own };
  }

  /** Is this address a Safe multisig? (threshold / owners count) */
  async function governanceNode(addr: Address, role: string, attachTo: string, layer: number) {
    if (addr === zeroAddress) {
      addEdge({ from: attachTo, to: attachTo, rel: `${role}: none (zero address)`, prov: [] });
      return;
    }
    const p = await profile(addr);
    const [th, thId] = await r.call<bigint>(addr, safeAbi, "getThreshold");
    const [owners, oId] = await r.call<Address[]>(addr, safeAbi, "getOwners");
    const isSafe = th !== undefined && owners !== undefined;
    const label = !p.data.isContract ? `EOA (${role})` : isSafe ? `Safe ${th}/${owners!.length} (${role})` : `Contract (${role})`;
    const id = `gov:${addr}`;
    addNode({ id, kind: "governance", layer, label, address: addr, data: { ...p.data, role, ...(isSafe ? { threshold: th, owners: owners!.length } : {}) }, prov: [...p.prov, ...(isSafe ? [thId, oId] : [])] });
    return id;
  }

  // ---------- Layer 1: the vault ----------
  const [isV10, f10] = await r.must<boolean>(ADDR.metaMorphoFactoryV1_0, factoryAbi, "isMetaMorpho", [vault]);
  const [isV11, f11] = await r.must<boolean>(ADDR.metaMorphoFactoryV1_1, factoryAbi, "isMetaMorpho", [vault]);
  if (!isV10 && !isV11)
    throw new Error(`${vault} is not a MetaMorpho V1.0/V1.1 vault per the factories' isMetaMorpho(). MetaMorpho V2 and other vaults are out of scope (different max* semantics).`);
  const version = isV10 ? "MetaMorpho V1.0" : "MetaMorpho V1.1";
  log(`vault ${vault}: ${version}`);

  const v = async <T,>(fn: string, args: unknown[] = []) => r.must<T>(vault, metaMorphoAbi, fn, args);
  const [name, nId] = await v<string>("name");
  const [asset, aId] = await v<Address>("asset");
  const [totalAssets, taId] = await v<bigint>("totalAssets");
  const [totalSupply, tsId] = await v<bigint>("totalSupply");
  const [morpho, mId] = await v<Address>("MORPHO");
  const [owner, ownId] = await v<Address>("owner");
  const [curator, curId] = await v<Address>("curator");
  const [guardian, gId] = await v<Address>("guardian");
  const [timelock, tlId] = await v<bigint>("timelock");
  const [fee, feeId] = await v<bigint>("fee");
  const [wql, wqlId] = await v<bigint>("withdrawQueueLength");
  const [paIsAllocator, paId] = await v<boolean>("isAllocator", [ADDR.publicAllocator]);
  const [assetSymbol, asId] = await r.must<string>(asset, erc20Abi, "symbol");
  const [assetDecimals, adId] = await r.must<number>(asset, erc20Abi, "decimals");
  if (getAddress(morpho) !== getAddress(ADDR.morphoBlue)) throw new Error(`unexpected MORPHO() ${morpho}`);
  const vaultProfile = await profile(vault);

  const vaultId = `vault:${vault}`;
  addNode({
    id: vaultId, kind: "vault", layer: 1, label: `${name} (${version})`, address: vault,
    data: { name, version, asset, assetSymbol, totalAssets, totalSupply, timelockSeconds: timelock, performanceFee: Number(fee) / 1e18, withdrawQueueLength: wql, ...vaultProfile.data },
    prov: [isV10 ? f10 : f11, nId, aId, taId, tsId, mId, tlId, feeId, wqlId, asId, adId, ...vaultProfile.prov],
  });
  addEdge({ from: vaultId, to: "chain:1", rel: "settles on", prov: [hdrId] });
  addEdge({ from: vaultId, to: `factory:${isV10 ? ADDR.metaMorphoFactoryV1_0 : ADDR.metaMorphoFactoryV1_1}`, rel: "created by (isMetaMorpho=true)", prov: [isV10 ? f10 : f11] });
  addNode({ id: `factory:${isV10 ? ADDR.metaMorphoFactoryV1_0 : ADDR.metaMorphoFactoryV1_1}`, kind: "governance", layer: 1, label: `${version} factory`, address: isV10 ? ADDR.metaMorphoFactoryV1_0 : ADDR.metaMorphoFactoryV1_1, data: {}, prov: [isV10 ? f10 : f11] });

  for (const [addr, role, pid] of [[owner, "owner", ownId], [curator, "curator", curId], [guardian, "guardian", gId]] as const) {
    const gid = await governanceNode(addr, role, vaultId, 1);
    if (gid) addEdge({ from: vaultId, to: gid, rel: `${role} (can change caps/queues/fees${role === "guardian" ? ": veto only" : ""}; timelock ${timelock}s)`, prov: [pid] });
  }
  addNode({ id: `alloc:${ADDR.publicAllocator}`, kind: "allocator", layer: 1, label: "Morpho Public Allocator", address: ADDR.publicAllocator, data: { isAllocatorOfTarget: paIsAllocator }, prov: [paId] });
  addEdge({ from: vaultId, to: `alloc:${ADDR.publicAllocator}`, rel: paIsAllocator ? "allocator (can move this vault's funds between its markets)" : "not an allocator", prov: [paId] });

  const morphoNodeId = `morpho:${ADDR.morphoBlue}`;
  const morphoProfile = await profile(ADDR.morphoBlue);
  addNode({ id: morphoNodeId, kind: "governance", layer: 2, label: "Morpho Blue (immutable core)", address: ADDR.morphoBlue, data: { ...morphoProfile.data, upgradeable: !morphoProfile.impl }, prov: [mId, ...morphoProfile.prov] });
  addEdge({ from: vaultId, to: morphoNodeId, rel: "supplies through", prov: [mId] });

  // ---------- Layer 2: markets in the withdraw queue ----------
  const markets: MarketState[] = [];
  for (let i = 0; i < Number(wql); i++) {
    const [id, qId] = await v<Hex>("withdrawQueue", [BigInt(i)]);
    const [cfg, cfgId] = await v<readonly [bigint, boolean, bigint]>("config", [id]);
    const [p, pId] = await r.must<readonly [Address, Address, Address, Address, bigint]>(ADDR.morphoBlue, morphoBlueAbi, "idToMarketParams", [id]);
    const [m, mkId] = await r.must<readonly bigint[]>(ADDR.morphoBlue, morphoBlueAbi, "market", [id]);
    const [pos, posId] = await r.must<readonly [bigint, bigint, bigint]>(ADDR.morphoBlue, morphoBlueAbi, "position", [id, vault]);
    const params: MarketParams = { loanToken: p[0], collateralToken: p[1], oracle: p[2], irm: p[3], lltv: p[4] };
    const [tsa, tss, tba, tbs, lastUpdate, mfee] = m;
    const vaultSupplyAssets = toAssetsDown(pos[0], tsa, tss);
    const liquidity = tsa - tba;
    const withdrawable = vaultSupplyAssets < liquidity ? vaultSupplyAssets : liquidity;
    const util = tsa === 0n ? 0 : Number((tba * 1_000_000n) / tsa) / 1e6;

    let borrowApr: number | null = null; let supplyApr: number | null = null; let irmProv: string[] = [];
    if (params.irm !== zeroAddress) {
      const [rate, rId] = await r.call<bigint>(params.irm, irmAbi, "borrowRateView", [
        { loanToken: params.loanToken, collateralToken: params.collateralToken, oracle: params.oracle, irm: params.irm, lltv: params.lltv },
        { totalSupplyAssets: tsa, totalSupplyShares: tss, totalBorrowAssets: tba, totalBorrowShares: tbs, lastUpdate, fee: mfee },
      ]);
      if (rate !== undefined) {
        borrowApr = (Number(rate) / 1e18) * SECONDS_PER_YEAR;
        supplyApr = borrowApr * util * (1 - Number(mfee) / 1e18);
        irmProv = [rId];
      }
    }
    let collateralSymbol = "none"; let collateralDecimals = 18; const tokProv: string[] = [];
    if (params.collateralToken !== zeroAddress) {
      const [sym, sId] = await r.must<string>(params.collateralToken, erc20Abi, "symbol");
      const [dec, dId] = await r.must<number>(params.collateralToken, erc20Abi, "decimals");
      collateralSymbol = sym; collateralDecimals = Number(dec); tokProv.push(sId, dId);
    }
    let oraclePrice: bigint | null = null; let opId: string | null = null;
    if (params.oracle !== zeroAddress) {
      const [px, id2] = await r.call<bigint>(params.oracle, morphoOracleAbi, "price");
      oraclePrice = px ?? null; opId = id2;
    }
    const ms: MarketState = {
      id, queueIndex: i, params,
      totalSupplyAssets: tsa, totalSupplyShares: tss, totalBorrowAssets: tba, totalBorrowShares: tbs, lastUpdate, fee: mfee,
      vaultSupplyShares: pos[0], vaultSupplyAssets, liquidity, vaultWithdrawable: withdrawable, utilization: util,
      borrowApr, supplyApr, cap: cfg[0], collateralSymbol, collateralDecimals, loanDecimals: Number(assetDecimals), oraclePrice,
    };
    markets.push(ms);
    const lif = Math.min(1.15, 1 / (0.3 * (Number(params.lltv) / 1e18) + 0.7));
    const mid = `market:${id}`;
    addNode({
      id: mid, kind: "market", layer: 2, label: `${collateralSymbol}/${assetSymbol} LLTV ${(Number(params.lltv) / 1e16).toFixed(1)}%`,
      data: {
        marketId: id, queueIndex: i, ...params, lltv: params.lltv, liquidationIncentiveFactor: lif,
        totalSupplyAssets: tsa, totalBorrowAssets: tba, liquidity, utilization: util,
        vaultSupplyAssets, vaultWithdrawable: withdrawable, vaultCap: cfg[0], enabled: cfg[1], borrowApr, supplyApr, oraclePrice,
      },
      prov: [qId, cfgId, pId, mkId, posId, ...irmProv, ...tokProv, ...(opId ? [opId] : [])],
    });
    addEdge({ from: vaultId, to: mid, rel: `withdraw queue #${i}`, data: { vaultSupplyAssets, withdrawable }, prov: [qId, posId] });
    addEdge({ from: mid, to: morphoNodeId, rel: "lives in", prov: [pId] });
    log(`  market #${i} ${collateralSymbol} supply=${vaultSupplyAssets} liq=${liquidity} util=${util.toFixed(3)}`);

    // ---------- Layer 3/4: IRM, oracle, collateral token ----------
    if (params.irm !== zeroAddress) {
      addNode({ id: `irm:${params.irm}`, kind: "irm", layer: 3, label: "Interest rate model", address: params.irm, data: {}, prov: [pId] });
      addEdge({ from: mid, to: `irm:${params.irm}`, rel: "borrow rate set by", data: { borrowApr }, prov: [pId, ...irmProv] });
    }
    if (params.collateralToken !== zeroAddress) {
      await collateralLayer(params.collateralToken, collateralSymbol, mid, tokProv);
    }
    if (params.oracle !== zeroAddress) {
      await oracleLayer(params.oracle, mid, pId, opId);
    }
  }

  async function collateralLayer(token: Address, symbol: string, marketNode: string, tokProv: string[]) {
    const tid = `token:${token}`;
    if (!nodes.has(tid)) {
      const p = await profile(token);
      const data: Record<string, unknown> = { symbol, ...p.data };
      const prov = [...tokProv, ...p.prov];
      // Probe known yield-source / custody hooks; absence is recorded, never assumed.
      const [stEth, sId] = await r.call<Address>(token, collateralProbeAbi, "stETH");
      const [rate, rId] = await r.call<bigint>(token, collateralProbeAbi, "stEthPerToken");
      const [under, uId] = await r.call<Address>(token, collateralProbeAbi, "asset");
      const [mm, mmId] = await r.call<Address>(token, collateralProbeAbi, "masterMinter");
      const [paused, psId] = await r.call<boolean>(token, collateralProbeAbi, "paused");
      if (rate !== undefined) { data.stEthPerToken = rate; prov.push(rId); }
      if (mm) { data.masterMinter = mm; prov.push(mmId); }
      if (paused !== undefined) { data.paused = paused; prov.push(psId); }
      addNode({ id: tid, kind: "token", layer: 3, label: `${symbol} (collateral)`, address: token, data, prov });
      if (p.admin || p.impl) {
        const adminLabel = p.admin ? `upgrade admin ${p.admin.slice(0, 10)}…` : "proxy";
        const gid = p.admin ? (await governanceNode(p.admin, `${symbol} proxy admin`, tid, 4)) : undefined;
        if (gid) addEdge({ from: tid, to: gid, rel: `upgradeable proxy (${adminLabel}); implementation ${p.impl}`, prov: p.prov });
      }
      if (p.owner) {
        const gid = await governanceNode(p.owner, `${symbol} owner`, tid, 4);
        if (gid) addEdge({ from: tid, to: gid, rel: "owner() (privileged role on token)", prov: p.prov });
      }
      if (mm) {
        const gid = await governanceNode(mm, `${symbol} masterMinter`, tid, 4);
        if (gid) addEdge({ from: tid, to: gid, rel: "masterMinter (controls minting: custodial issuance)", prov: [mmId] });
      }
      if (stEth) {
        const [pooled, poId] = await r.call<bigint>(stEth, collateralProbeAbi, "getTotalPooledEther");
        const [sym2, s2] = await r.call<string>(stEth, erc20Abi, "symbol");
        const [impl, iId] = await r.call<Address>(stEth, collateralProbeAbi, "implementation");
        const [kernel, kId] = await r.call<Address>(stEth, collateralProbeAbi, "kernel");
        const yid = `yield:${stEth}`;
        addNode({
          id: yid, kind: "yieldSource", layer: 4, label: `${sym2 ?? "stETH"} (Lido staking pool: yield & slashing source)`, address: stEth,
          data: { totalPooledEther: pooled, implementation: impl, aragonKernel: kernel },
          prov: [sId, poId, s2, iId, kId].filter(Boolean) as string[],
        });
        addEdge({ from: tid, to: yid, rel: `wraps (stEthPerToken = ${rate})`, prov: [sId, rId] });
        if (kernel) {
          addNode({ id: `gov:${kernel}`, kind: "governance", layer: 5, label: "Lido Aragon kernel (upgrades stETH)", address: kernel, data: {}, prov: [kId] });
          addEdge({ from: yid, to: `gov:${kernel}`, rel: "upgradeable via Aragon kernel / Lido DAO", prov: [kId, iId] });
        }
        addEdge({ from: yid, to: "chain:1", rel: "rewards & slashing from Ethereum validators", prov: [poId] });
      } else if (under) {
        addNode({ id: `token:${under}`, kind: "token", layer: 4, label: "underlying asset", address: under, data: {}, prov: [uId] });
        addEdge({ from: tid, to: `token:${under}`, rel: "ERC-4626 wrapper of", prov: [uId] });
      }
    }
    addEdge({ from: marketNode, to: tid, rel: "collateral", prov: tokProv });
  }

  async function oracleLayer(oracle: Address, marketNode: string, paramsId: string, priceId: string | null, rel = "priced by (liquidations & borrow limits)") {
    const oid = `oracle:${oracle}`;
    if (!nodes.has(oid)) {
      const fields = ["BASE_FEED_1", "BASE_FEED_2", "QUOTE_FEED_1", "QUOTE_FEED_2", "BASE_VAULT", "QUOTE_VAULT", "SCALE_FACTOR"] as const;
      const got: Record<string, unknown> = {}; const prov: string[] = priceId ? [priceId] : [];
      for (const f of fields) {
        const [val, id] = await r.call<unknown>(oracle, morphoOracleAbi, f);
        if (val !== undefined) { got[f] = val; prov.push(id); }
      }
      const morphoShape = got.SCALE_FACTOR !== undefined;
      const feeds = (["BASE_FEED_1", "BASE_FEED_2", "QUOTE_FEED_1", "QUOTE_FEED_2"] as const)
        .map((k) => [k, got[k] as Address | undefined] as const)
        .filter(([, a]) => a && a !== zeroAddress) as [string, Address][];
      const vaults = (["BASE_VAULT", "QUOTE_VAULT"] as const)
        .map((k) => [k, got[k] as Address | undefined] as const)
        .filter(([, a]) => a && a !== zeroAddress) as [string, Address][];
      const p = await profile(oracle);
      addNode({
        id: oid, kind: "oracle", layer: marketNode.startsWith("oracle:") ? 4 : 3,
        label: morphoShape ? `Morpho Chainlink-style oracle (${feeds.length} feed${feeds.length === 1 ? "" : "s"}${vaults.length ? ", ERC-4626 conversion" : ""})` : "Oracle (opaque: price() only)",
        address: oracle,
        data: { ...got, morphoOracleShape: morphoShape, immutable: !p.impl, feedCount: feeds.length, ...p.data },
        prov: [...prov, ...p.prov],
      });
      if (!morphoShape) {
        // Probe a primary/backup router; recurse into both legs.
        const [primary, prId] = await r.call<Address>(oracle, oracleRouterAbi, "primaryOracle");
        const [backup, bkId] = await r.call<Address>(oracle, oracleRouterAbi, "backupOracle");
        if (primary && backup) {
          const node = nodes.get(oid)!;
          const extra: Record<string, unknown> = {};
          for (const f of ["currentOracle", "isPrimary", "deviationThreshold", "getDeviation", "challengeTimelockDuration", "healingTimelockDuration", "isChallenged"] as const) {
            const [val, id] = await r.call<unknown>(oracle, oracleRouterAbi, f);
            if (val !== undefined) { extra[f] = val; node.prov.push(id); }
          }
          node.label = `Oracle router (primary/backup, deviation challenge ${Number(extra.deviationThreshold ?? 0n) / 1e16}%)`;
          Object.assign(node.data, extra, { router: true });
          node.prov.push(prId, bkId);
          await oracleLayer(primary, oid, prId, null, "primary leg");
          await oracleLayer(backup, oid, bkId, null, "backup leg");
        } else {
          notes.push(`Oracle ${oracle}: unknown shape; only price() is read, its inputs are not discovered.`);
        }
      }
      for (const [slot, feed] of feeds) await feedLayer(feed, oid, slot, prov);
      if (morphoShape) {
        // Readable formula from the discovered feeds: base feeds multiply, quote feeds divide.
        const desc = (slot: string) => feeds.filter(([s]) => s.startsWith(slot)).map(([, f]) => String(nodes.get(`feed:${f}`)?.data.description ?? "feed"));
        const base = [...desc("BASE"), ...vaults.filter(([s]) => s === "BASE_VAULT").map(() => "vault rate")];
        const quote = [...desc("QUOTE"), ...vaults.filter(([s]) => s === "QUOTE_VAULT").map(() => "vault rate")];
        nodes.get(oid)!.label = `Oracle: ${base.join(" × ") || "1"}${quote.length ? " ÷ " + quote.join(" × ") : ""}`;
      }
      for (const [slot, vaultAddr] of vaults) {
        const [sym, sId] = await r.call<string>(vaultAddr, erc20Abi, "symbol");
        addNode({ id: `token:${vaultAddr}`, kind: "token", layer: 4, label: `${sym ?? "vault"} (ERC-4626 rate source)`, address: vaultAddr, data: {}, prov: sId ? [sId] : [] });
        addEdge({ from: oid, to: `token:${vaultAddr}`, rel: `${slot}: convertToAssets() exchange rate`, prov });
      }
    }
    addEdge({ from: marketNode, to: oid, rel, prov: [paramsId] });
  }

  async function feedLayer(feed: Address, oracleNode: string, slot: string, oProv: string[]) {
    const fid = `feed:${feed}`;
    if (!nodes.has(fid)) {
      const [desc, dId] = await r.call<string>(feed, chainlinkFeedAbi, "description");
      const [dec, decId] = await r.call<number>(feed, chainlinkFeedAbi, "decimals");
      const [round, rId] = await r.call<readonly [bigint, bigint, bigint, bigint, bigint]>(feed, chainlinkFeedAbi, "latestRoundData");
      const [agg, aId] = await r.call<Address>(feed, chainlinkFeedAbi, "aggregator");
      const p = await profile(feed);
      const updatedAt = round ? round[3] : null;
      // updatedAt = 0 means a live-computed adapter (e.g. exchange rate read on each call): no staleness notion
      const ageSeconds = updatedAt !== null && updatedAt > 0n ? Number(SOURCE.timestamp - updatedAt) : null;
      addNode({
        id: fid, kind: "feed", layer: 4, label: `${desc ?? "feed"}${agg ? " (Chainlink proxy)" : " (adapter / custom feed)"}`, address: feed,
        data: { description: desc, decimals: dec, answer: round?.[1], updatedAt, ageSeconds, hasAggregator: !!agg, ...p.data },
        prov: [dId, decId, rId, ...(agg ? [aId] : []), ...p.prov].filter(Boolean),
      });
      if (agg) {
        const [minA, mnId] = await r.call<bigint>(agg, chainlinkFeedAbi, "minAnswer");
        const [maxA, mxId] = await r.call<bigint>(agg, chainlinkFeedAbi, "maxAnswer");
        addNode({ id: `agg:${agg}`, kind: "aggregator", layer: 5, label: "Chainlink aggregator (off-chain node operators)", address: agg, data: { minAnswer: minA, maxAnswer: maxA }, prov: [aId, mnId, mxId] });
        addEdge({ from: fid, to: `agg:${agg}`, rel: "reads answers from", prov: [aId] });
      }
      if (p.owner) {
        const gid = await governanceNode(p.owner as Address, "feed owner", fid, 5);
        if (gid) addEdge({ from: fid, to: gid, rel: "owner (can switch aggregator)", prov: p.prov });
      }
    }
    addEdge({ from: oracleNode, to: fid, rel: slot, prov: oProv });
  }

  /** Largest holders of a vault: API candidates, balances re-read on-chain at the block. */
  async function topHolders(v: Address, supply: bigint, first: number): Promise<{ list: Holder[]; coverage: number; prov: string[] }> {
    const api = await holderCandidates(v, first);
    const apiId = r.offchain(api.rec);
    const [bals, bIds] = await r.multi<bigint>(metaMorphoAbi, "balanceOf", api.addresses.map((a) => ({ to: v, args: [a] })));
    const [vals, vIds] = await r.multi<bigint>(metaMorphoAbi, "convertToAssets", api.addresses.map((_, i) => ({ to: v, args: [bals[i] ?? 0n] })));
    const list: Holder[] = [];
    for (let i = 0; i < api.addresses.length; i++) {
      const sh = bals[i] ?? 0n;
      if (sh === 0n) continue;
      const code = await r.client.getCode({ address: api.addresses[i], blockNumber: r.block });
      list.push({ address: api.addresses[i], shares: sh, assets: vals[i] ?? 0n, shareOfSupply: supply === 0n ? 0 : Number((sh * 1_000_000n) / supply) / 1e6, isContract: !!code && code !== "0x" });
    }
    list.sort((a, b) => (b.shares > a.shares ? 1 : -1));
    const cov = list.reduce((s2, h) => s2 + h.shares, 0n);
    return { list, coverage: supply === 0n ? 0 : Number((cov * 1_000_000n) / supply) / 1e6, prov: [apiId, ...new Set([...bIds, ...vIds])] };
  }

  log("largest holders (Morpho API candidates, balanceOf re-read on-chain)...");
  const holders = await topHolders(vault, totalSupply, 25);
  addNode({
    id: `holders:${vault}`, kind: "holders", layer: 1,
    label: `Holders: top ${holders.list.length} = ${(holders.coverage * 100).toFixed(1)}% of shares`,
    data: { coverage: holders.coverage, largestShare: holders.list[0]?.shareOfSupply ?? 0, top3Share: holders.list.slice(0, 3).reduce((s2, h) => s2 + h.shareOfSupply, 0) },
    prov: holders.prov,
  });
  addEdge({ from: vaultId, to: `holders:${vault}`, rel: "owned by (concentration = who can drain liquidity first)", prov: holders.prov });

  // ---------- Peer vaults sharing the same markets ----------
  const exposed = markets.filter((m) => m.vaultSupplyAssets > 0n);
  const peers: PeerExposure[] = [];
  if (opts.peers !== false && exposed.length) {
    log("peer vault candidates from Morpho API, each verified on-chain...");
    const api = await supplyingVaultCandidates(exposed.map((m) => m.id));
    const scanId = r.offchain(api.rec);
    // Keep only MetaMorpho V1 vaults (factory check on-chain); others are counted in the coverage gap.
    const cand0 = api.addresses.filter((a) => a !== vault);
    const [f10s] = await r.multi<boolean>(factoryAbi, "isMetaMorpho", cand0.map((c) => ({ to: ADDR.metaMorphoFactoryV1_0 as Address, args: [c] })));
    const [f11s] = await r.multi<boolean>(factoryAbi, "isMetaMorpho", cand0.map((c) => ({ to: ADDR.metaMorphoFactoryV1_1 as Address, args: [c] })));
    const candidates = cand0.filter((_, i) => f10s[i] || f11s[i]);
    log(`  ${cand0.length} candidates, ${candidates.length} verified MetaMorpho V1`);
    const calls = candidates.flatMap((c) => exposed.map((m) => ({ to: ADDR.morphoBlue as Address, args: [m.id, c] })));
    const [posVals, posIds] = await r.multi<readonly [bigint, bigint, bigint]>(morphoBlueAbi, "position", calls);
    const withPos = candidates.map((c, ci) => ({
      vault: c,
      ms: exposed.map((m, mi) => ({ m, shares: posVals[ci * exposed.length + mi]?.[0] ?? 0n, prov: posIds[ci * exposed.length + mi] })),
    })).filter((x) => x.ms.some((y) => y.shares > 0n));
    // Sequential on purpose: read ids (provenance) must be numbered identically on every run
    await pmap(withPos, 1, async (pv) => {
      const [pname, pnId] = await r.must<string>(pv.vault, metaMorphoAbi, "name");
      const [pta, ptaId] = await r.must<bigint>(pv.vault, metaMorphoAbi, "totalAssets");
      const [pwql] = await r.must<bigint>(pv.vault, metaMorphoAbi, "withdrawQueueLength");
      const [queueVals, qIds] = await r.multi<Hex>(metaMorphoAbi, "withdrawQueue", Array.from({ length: Number(pwql) }, (_, i) => ({ to: pv.vault, args: [BigInt(i)] })));
      const [isV10b] = await r.must<boolean>(ADDR.metaMorphoFactoryV1_0, factoryAbi, "isMetaMorpho", [pv.vault]);
      const [paOn, paOnId] = await r.must<boolean>(pv.vault, metaMorphoAbi, "isAllocator", [ADDR.publicAllocator]);
      const flowCaps: PeerExposure["publicAllocator"]["flowCaps"] = []; const fcProv: string[] = [];
      if (paOn) for (const x of pv.ms) {
        const [fc, fcId] = await r.must<readonly [bigint, bigint]>(ADDR.publicAllocator, publicAllocatorAbi, "flowCaps", [pv.vault, x.m.id]);
        flowCaps.push({ id: x.m.id, maxIn: fc[0], maxOut: fc[1] }); fcProv.push(fcId);
      }
      // Public Allocator backstop = NET new liquidity anyone can pull into the target's exposed markets from
      // this peer's markets that the target does NOT use (moving funds between two exposed markets creates none):
      //   min( sum over exposed targets of min(maxIn, cap headroom),  sum over non-exposed sources of min(maxOut, peer supply, market liquidity) )
      // Upper bound: two peers drawing on the same source market share its liquidity.
      const reallocatableIn: { id: Hex; amount: bigint }[] = [];
      const inCaps = flowCaps.filter((f) => f.maxIn > 0n);
      if (inCaps.length) {
        let inRoom = 0n;
        for (const fc of inCaps) {
          const [cfg, cfgId] = await r.must<readonly [bigint, boolean, bigint]>(pv.vault, metaMorphoAbi, "config", [fc.id]);
          const cur = pv.ms.find((x) => x.m.id === fc.id);
          const curAssets = cur ? toAssetsDown(cur.shares, cur.m.totalSupplyAssets, cur.m.totalSupplyShares) : 0n;
          const headroom = cfg[0] > curAssets ? cfg[0] - curAssets : 0n;
          inRoom += fc.maxIn < headroom ? fc.maxIn : headroom;
          fcProv.push(cfgId);
        }
        let source = 0n;
        for (const q of queueVals) {
          if (!q || exposed.some((m) => m.id === q)) continue;
          const [qfc, qfcId] = await r.must<readonly [bigint, bigint]>(ADDR.publicAllocator, publicAllocatorAbi, "flowCaps", [pv.vault, q]);
          fcProv.push(qfcId);
          if (qfc[1] === 0n) continue;
          const [qm, qmId] = await r.must<readonly bigint[]>(ADDR.morphoBlue, morphoBlueAbi, "market", [q]);
          const [qp, qpId] = await r.must<readonly [bigint, bigint, bigint]>(ADDR.morphoBlue, morphoBlueAbi, "position", [q, pv.vault]);
          const sup = toAssetsDown(qp[0], qm[0], qm[1]);
          const liq = qm[0] - qm[2];
          source += [qfc[1], sup, liq].reduce((x, y) => (x < y ? x : y));
          fcProv.push(qmId, qpId);
        }
        reallocatableIn.push({ id: inCaps[0].id, amount: inRoom < source ? inRoom : source });
      }
      const [psupply] = await r.must<bigint>(pv.vault, metaMorphoAbi, "totalSupply");
      const ph = await topHolders(pv.vault, psupply, 5);
      fcProv.push(...ph.prov);
      const peer: PeerExposure = {
        vault: pv.vault, name: pname, version: isV10b ? "MetaMorpho V1.0" : "MetaMorpho V1.1", totalAssets: pta,
        topHolder: ph.list[0] ?? null,
        markets: pv.ms.filter((x) => x.shares > 0n).map((x) => ({
          id: x.m.id,
          supplyAssets: toAssetsDown(x.shares, x.m.totalSupplyAssets, x.m.totalSupplyShares),
          queueIndex: queueVals.findIndex((q) => q === x.m.id) >= 0 ? queueVals.findIndex((q) => q === x.m.id) : null,
        })),
        publicAllocator: { enabled: paOn, flowCaps, reallocatableIn },
      };
      peers.push(peer);
      const pid = `peer:${pv.vault}`;
      addNode({ id: pid, kind: "peerVault", layer: 2, label: `${pname} (peer vault)`, address: pv.vault, data: { totalAssets: pta, version: peer.version, publicAllocatorEnabled: paOn }, prov: [scanId, pnId, ptaId, paOnId, ...fcProv] });
      for (const x of peer.markets)
        addEdge({ from: pid, to: `market:${x.id}`, rel: `also lends here (queue #${x.queueIndex ?? "absent"})`, data: { supplyAssets: x.supplyAssets }, prov: [scanId, ...pv.ms.filter((y) => y.m.id === x.id).map((y) => y.prov), ...(qIds.length ? [qIds[0]] : [])] });
    });
    peers.sort((a, b) => (b.totalAssets > a.totalAssets ? 1 : -1));
    // Supply coverage: how much of each market's supply is explained by the target + discovered vaults
    for (const m of exposed) {
      const node = nodes.get(`market:${m.id}`)!;
      const fromVaults = m.vaultSupplyAssets + peers.reduce((s, p) => s + (p.markets.find((x) => x.id === m.id)?.supplyAssets ?? 0n), 0n);
      node.data.supplyFromMetaMorphoVaults = fromVaults;
      node.data.supplyCoverageByVaults = m.totalSupplyAssets === 0n ? 0 : Number((fromVaults * 10_000n) / m.totalSupplyAssets) / 10_000;
      node.data.peerVaultCount = peers.filter((p) => p.markets.some((x) => x.id === m.id)).length;
    }
  }

  // ---------- Borrowers of each exposed market ----------
  const borrowers: DependencyGraph["borrowers"] = {};
  if (opts.borrowers !== false && exposed.length) {
    log("borrower candidates from Morpho API, each position re-read on-chain...");
    for (const m of exposed) {
      const api = await borrowerCandidates(m.id);
      const scanId = r.offchain(api.rec);
      const cands = api.addresses;
      const [vals, ids] = await r.multi<readonly [bigint, bigint, bigint]>(morphoBlueAbi, "position", cands.map((c) => ({ to: ADDR.morphoBlue as Address, args: [m.id, c] })));
      const list: Borrower[] = [];
      cands.forEach((c, i) => {
        const pos = vals[i];
        if (!pos || pos[1] === 0n) return;
        const debt = toAssetsUp(pos[1], m.totalBorrowAssets, m.totalBorrowShares);
        const collValue = m.oraclePrice !== null ? (pos[2] * m.oraclePrice) / 10n ** 36n : null;
        list.push({ address: c, borrowShares: pos[1], collateral: pos[2], debt, ltv: collValue ? Number((debt * 1_000_000n) / (collValue === 0n ? 1n : collValue)) / 1e6 : null });
      });
      list.sort((a, b) => (b.debt > a.debt ? 1 : -1));
      const covShares = list.reduce((s, b) => s + b.borrowShares, 0n);
      const coverage = m.totalBorrowShares === 0n ? 1 : Number((covShares * 1_000_000n) / m.totalBorrowShares) / 1e6;
      borrowers[m.id] = { coverage, count: list.length, list };
      const bid = `borrowers:${m.id}`;
      const top = list[0];
      addNode({
        id: bid, kind: "borrowers", layer: 3, label: `${list.length} borrowers (${(coverage * 100).toFixed(2)}% of debt identified)`,
        data: { count: list.length, coverage, largestDebt: top?.debt, largestShare: top ? Number((top.debt * 10_000n) / (m.totalBorrowAssets || 1n)) / 10_000 : 0, maxLtv: list.reduce((mx, b) => Math.max(mx, b.ltv ?? 0), 0) },
        prov: [scanId, ...new Set(ids)],
      });
      addEdge({ from: `market:${m.id}`, to: bid, rel: "lent to (repayment is the only way idle liquidity comes back)", prov: [scanId] });
      log(`  ${m.collateralSymbol} market: ${list.length} borrowers, coverage ${(coverage * 100).toFixed(3)}%`);
    }
  }

  // ---------- AMM layer: can liquidators sell the seized collateral? ----------
  const dex: DependencyGraph["dex"] = {};
  if (opts.dex !== false) {
    const venueCache = new Map<string, Venue[]>();
    for (const m of exposed) {
      if (m.params.collateralToken === zeroAddress || m.oraclePrice === null) continue;
      const key = m.params.collateralToken + m.params.loanToken;
      if (!venueCache.has(key)) venueCache.set(key, await discoverVenues(r, m.params.collateralToken, m.params.loanToken));
      const venues = venueCache.get(key)!;
      const atRisk = (borrowers[m.id]?.list ?? []).reduce((s, b) => s + b.collateral, 0n);
      const unit = 10n ** BigInt(m.collateralDecimals);
      const out: DependencyGraph["dex"][string]["venues"] = [];
      for (const v of venues) {
        const c = await venueCapacity(v, m.oraclePrice, lifWad(m.params.lltv), unit, atRisk > unit ? atRisk : unit, m.collateralDecimals - m.loanDecimals);
        out.push({ id: v.id, route: v.route, pool: v.pool, capacity: c.capacity, avgPrice: c.avgPriceAtCapacity });
        const did = `dex:${v.pool}`;
        addNode({ id: did, kind: "dex", layer: 4, label: v.route, address: v.pool, data: { venue: v.kind }, prov: v.prov });
        addEdge({ from: `token:${getAddress(m.params.collateralToken)}`, to: did, rel: "sold by liquidators via", prov: v.prov });
      }
      // Direct venues add up; two-hop routes share their WETH leg, so only the best one counts (lower bound).
      const direct = out.filter((x) => !x.id.startsWith("2hop:")).reduce((s, x) => s + x.capacity, 0n);
      const bestHop = out.filter((x) => x.id.startsWith("2hop:")).reduce((mx, x) => (x.capacity > mx ? x.capacity : mx), 0n);
      const capacity = direct + bestHop;
      dex[m.id] = { capacity, collateralAtRisk: atRisk, venues: out };
      const node = nodes.get(`market:${m.id}`)!;
      node.data.liquidationCapacityCollateral = capacity;
      node.data.collateralPostedByBorrowers = atRisk;
      log(`  ${m.collateralSymbol} market #${m.queueIndex}: ${venues.length} venues, liquidation capacity ${capacity} / collateral ${atRisk}`);
    }
  }

  const withdrawableTotal = markets.reduce((s, m) => s + m.vaultWithdrawable, 0n);
  const lentOut = markets.reduce((s, m) => s + (m.vaultSupplyAssets - m.vaultWithdrawable), 0n);
  const supplyApy = (() => {
    const tot = markets.reduce((s, m) => s + m.vaultSupplyAssets, 0n);
    if (tot === 0n) return null;
    const w = markets.reduce((s, m) => s + (m.supplyApr ?? 0) * Number(m.vaultSupplyAssets), 0) / Number(tot);
    return Math.exp(w) - 1;
  })();

  const g: DependencyGraph = {
    schema: "exitproof.graph/0.1",
    source: { chainId: 1, block: SOURCE.block.toString(), blockHash: hdr.hash, timestamp: hdr.timestamp.toString(), baseFeePerGas: hdr.baseFeePerGas?.toString() ?? null },
    target: { vault, name, version, asset, assetSymbol, assetDecimals: Number(assetDecimals) },
    summary: {
      totalAssets, totalSupply, withdrawableNow: withdrawableTotal, lentOutNotWithdrawable: lentOut,
      liquidRatio: totalAssets === 0n ? 0 : Number((withdrawableTotal * 10_000n) / totalAssets) / 10_000,
      grossSupplyApyBeforeVaultFee: supplyApy, vaultPerformanceFee: Number(fee) / 1e18,
      marketCount: markets.length, exposedMarketCount: exposed.length, peerVaultCount: peers.length,
      publicAllocatorIsAllocator: paIsAllocator,
      publicAllocatorReallocatableIntoExposedMarkets: peers.reduce((t, p) => t + p.publicAllocator.reallocatableIn.reduce((a, x) => a + x.amount, 0n), 0n),
      nodeCount: nodes.size, edgeCount: edges.length, readCount: r.reads.length,
    },
    markets, peers, borrowers, holders: { coverage: holders.coverage, list: holders.list }, dex,
    nodes: [...nodes.values()], edges, reads: r.reads,
    notes: [
      "All values are eth_call / eth_getStorageAt / eth_getLogs reads at the frozen block through the local proxy; every node and edge lists the read ids it rests on.",
      "Market totals are the stored values at the block (interest accrued up to lastUpdate); MetaMorpho's maxWithdraw adds interest accrued since, hence tiny differences.",
      "Allocators other than the Public Allocator are not enumerated (would need SetIsAllocator event history).",
      ...notes,
    ],
  };
  return g;
}
