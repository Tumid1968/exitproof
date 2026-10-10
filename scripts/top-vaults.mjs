// Lists the largest MetaMorpho V1 vaults on Ethereum by TVL (Morpho API), for cache pre-warming.
// Usage: node scripts/top-vaults.mjs [n]  -> prints addresses, one per line
const n = Number(process.argv[2] ?? 20);
const q = async (query) => (await (await fetch("https://blue-api.morpho.org/graphql", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query }) })).json());
const V1 = ["0xA9c3D3a366466Fa809d1Ae982Fb2c46E5fC41101", "0x1897A8997241C1cD4bD0698647e4EB7213535c24"];
const r = await q(`{ vaults(first: 100, orderBy: TotalAssetsUsd, orderDirection: Desc, where:{chainId_in:[1], factoryAddress_in:${JSON.stringify(V1)}}) { items { address name asset { symbol } state { totalAssetsUsd } } } }`);
const keep = ["WETH", "USDC", "USDT", "DAI", "USDS", "PYUSD", "USDe", "RLUSD", "WBTC", "cbBTC"];
const items = r.data.vaults.items.filter((v) => keep.includes(v.asset.symbol)).slice(0, n);
for (const v of items) console.error(`${v.address} ${v.asset.symbol.padEnd(6)} ${(v.state.totalAssetsUsd / 1e6).toFixed(1)}M ${v.name}`);
console.log(items.map((v) => v.address).join("\n"));
