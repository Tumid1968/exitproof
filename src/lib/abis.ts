import { parseAbi } from "viem";

export const erc20Abi = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function approve(address,uint256) returns (bool)",
  "function transfer(address,uint256) returns (bool)",
  "function deposit() payable",
]);

export const metaMorphoAbi = parseAbi([
  "function asset() view returns (address)",
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalAssets() view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function convertToAssets(uint256) view returns (uint256)",
  "function maxWithdraw(address) view returns (uint256)",
  "function maxRedeem(address) view returns (uint256)",
  "function redeem(uint256 shares, address receiver, address owner) returns (uint256)",
  "function withdraw(uint256 assets, address receiver, address owner) returns (uint256)",
  "function owner() view returns (address)",
  "function curator() view returns (address)",
  "function guardian() view returns (address)",
  "function timelock() view returns (uint256)",
  "function fee() view returns (uint96)",
  "function feeRecipient() view returns (address)",
  "function skimRecipient() view returns (address)",
  "function isAllocator(address) view returns (bool)",
  "function MORPHO() view returns (address)",
  "function supplyQueueLength() view returns (uint256)",
  "function supplyQueue(uint256) view returns (bytes32)",
  "function withdrawQueueLength() view returns (uint256)",
  "function withdrawQueue(uint256) view returns (bytes32)",
  "function config(bytes32) view returns (uint184 cap, bool enabled, uint64 removableAt)",
  "function lastTotalAssets() view returns (uint256)",
  "event SetIsAllocator(address indexed allocator, bool isAllocator)",
]);

export const morphoBlueAbi = parseAbi([
  "function idToMarketParams(bytes32) view returns (address loanToken, address collateralToken, address oracle, address irm, uint256 lltv)",
  "function market(bytes32) view returns (uint128 totalSupplyAssets, uint128 totalSupplyShares, uint128 totalBorrowAssets, uint128 totalBorrowShares, uint128 lastUpdate, uint128 fee)",
  "function position(bytes32, address) view returns (uint256 supplyShares, uint128 borrowShares, uint128 collateral)",
  "function owner() view returns (address)",
  "function feeRecipient() view returns (address)",
  "function accrueInterest((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv))",
  "function liquidate((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv) marketParams, address borrower, uint256 seizedAssets, uint256 repaidShares, bytes data) returns (uint256, uint256)",
  "event Borrow(bytes32 indexed id, address caller, address indexed onBehalf, address indexed receiver, uint256 assets, uint256 shares)",
]);

export const factoryAbi = parseAbi([
  "function isMetaMorpho(address) view returns (bool)",
  "event CreateMetaMorpho(address indexed metaMorpho, address indexed caller, address initialOwner, uint256 initialTimelock, address indexed asset, string name, string symbol, bytes32 salt)",
]);

/** Morpho's MorphoChainlinkOracleV2 (and V1 shape): feeds + ERC-4626 vault conversions. */
export const morphoOracleAbi = parseAbi([
  "function price() view returns (uint256)",
  "function BASE_FEED_1() view returns (address)",
  "function BASE_FEED_2() view returns (address)",
  "function QUOTE_FEED_1() view returns (address)",
  "function QUOTE_FEED_2() view returns (address)",
  "function BASE_VAULT() view returns (address)",
  "function QUOTE_VAULT() view returns (address)",
  "function BASE_VAULT_CONVERSION_SAMPLE() view returns (uint256)",
  "function QUOTE_VAULT_CONVERSION_SAMPLE() view returns (uint256)",
  "function SCALE_FACTOR() view returns (uint256)",
]);

export const chainlinkFeedAbi = parseAbi([
  "function description() view returns (string)",
  "function decimals() view returns (uint8)",
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
  "function aggregator() view returns (address)",
  "function owner() view returns (address)",
  "function minAnswer() view returns (int192)",
  "function maxAnswer() view returns (int192)",
]);

export const irmAbi = parseAbi([
  "function borrowRateView((address loanToken, address collateralToken, address oracle, address irm, uint256 lltv), (uint128 totalSupplyAssets, uint128 totalSupplyShares, uint128 totalBorrowAssets, uint128 totalBorrowShares, uint128 lastUpdate, uint128 fee)) view returns (uint256)",
  "function rateAtTarget(bytes32) view returns (int256)",
]);

export const publicAllocatorAbi = parseAbi([
  "function flowCaps(address vault, bytes32 id) view returns (uint128 maxIn, uint128 maxOut)",
  "function fee(address vault) view returns (uint256)",
  "function admin(address vault) view returns (address)",
]);

/** Underlying-yield / custody hooks on collateral tokens (probed, never assumed). */
export const collateralProbeAbi = parseAbi([
  "function stETH() view returns (address)",
  "function stEthPerToken() view returns (uint256)",
  "function getTotalPooledEther() view returns (uint256)",
  "function getTotalShares() view returns (uint256)",
  "function owner() view returns (address)",
  "function masterMinter() view returns (address)",
  "function pauser() view returns (address)",
  "function paused() view returns (bool)",
  "function getImplementation() view returns (address)",
  "function convertToAssets(uint256) view returns (uint256)",
  "function asset() view returns (address)",
]);

export const safeAbi = parseAbi([
  "function getThreshold() view returns (uint256)",
  "function getOwners() view returns (address[])",
  "function VERSION() view returns (string)",
]);
