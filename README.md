# ExitProof

**For a position in a MetaMorpho V1 vault, ExitProof finds the hidden dependencies, propagates failures through them, and answers the portfolio manager's real question: does the expected loss of staying justify exiting now, despite exit costs and the liquidity you cannot get out?**

Built for the BSA EPFL hackathon (10–11 October 2026), Belem Capital track, *DeFi Risk Dependency Challenge*.

Everything runs on **real Ethereum state frozen at block 26,157,638** (`0x3e84…7bf4`, 2026-10-09 21:47 UTC). Exits and shocks are **executed** on a local Hardhat 3 fork of that block. Each run can be replayed to the wei, and the replay also works offline.

> Every number in this README was produced by the code in this repository (`npm run build:report`, `npm run replay`).

## What it does

1. **Dependency discovery** (`src/discovery/`). It starts from the vault address alone and walks the stack with `eth_call` / `eth_getStorageAt` / `eth_getCode` at the frozen block. Each node and link of the graph lists the reads it rests on (contract, function, arguments, block, raw result).
   - L0 settlement chain → L1 vault: version checked with the factories' `isMetaMorpho`, plus owner, curator, guardian (Safe threshold read on-chain), timelock, fee and Public Allocator
   - L2 every Morpho Blue market of the withdraw queue: params, utilization, idle liquidity, the vault's withdrawable share
   - L3 oracle, IRM, collateral token, borrowers
   - L4 price feeds, exchange-rate adapters, oracle **routers** (primary/backup with a deviation challenge, behind EIP-1167 clones), the collateral yield source (wstETH → stETH / Lido) and token admins (proxy admin, owner, masterMinter)
   - L5 Chainlink aggregators, feed owners, Lido's Aragon kernel
   - **Peer vaults** that lend in the same markets and compete for the same liquidity, plus the **Public Allocator** backstop each of them could bring
   - **Borrowers** of each exposed market, with coverage measured on-chain (Σ borrow shares found / total borrow shares)
2. **Shock propagation** (`src/shocks/analytic.ts`, `src/engine/scenario.ts`). A shock hits one discovered node and moves only along discovered edges: feed → oracle (active router leg only) → market → borrowers → vault → holder. Three shock types are modelled:
   - a price feed moves, and the oracle sees it;
   - the collateral **depegs on the market but the oracle is blind to it**;
   - an oracle overprices the collateral.

   The impact is computed analytically for sensitivity sweeps, and **executed on the fork**: the oracle is replaced by a constant and every unhealthy borrower is liquidated with a real `liquidate` transaction. Bad debt is read from Morpho Blue's `Liquidate` event, then the vault and holder values are re-read. Exit runs (other holders, including holders of **other vaults**, leaving first) are executed the same way.
3. **Stay / exit verdict** (`src/verdict/verdict.ts`). Expected loss of staying = p × incident loss. Exit cost = forgone yield on what can leave now (net APY read on-chain) + gas out and back (gas used on the fork × base fee of the block) + slippage measured on the fork. Any part that cannot leave stays exposed. The tool outputs the **break-even probability p\*** and a sensitivity analysis. **p is the user's assumption, never a prediction.**
4. **Executed proof.** `results/manifest.json` (sha256) records every scenario (inputs, timestamps `T0 + 12·k`, expected amounts, statuses, decoded errors). `npm run replay` re-executes them all on a fresh fork and compares to the wei, both online and offline (local proxy serving its disk cache).

## Results for Steakhouse ETH, largest holder (5,209.91 WETH = 53.6 % of the vault)

Data labels used everywhere: **on-chain** (real data read at the block) · **fork** (transaction simulated locally, never sent to Ethereum) · **hypothesis** (impersonated actors, shocks, probabilities).

**Liquidity now (on-chain):** 9,718.21 WETH total, 6,946.905 withdrawable (71.5 %). About 2,771 WETH are lent to borrowers, mostly against wstETH. The Public Allocator could reallocate **0 WETH** into the exposed markets: the flow caps of the peer vaults are 0, or their other markets give no room.

**Who exits before you (fork, impersonated actors):**

| Exits executed first | Holder max withdraw (WETH) | Full exit | vs alone |
|---|---:|---|---:|
| nobody | 5,209.91 | ✓ | — |
| holder #3, #4, or both | 5,209.91 | ✓ | 0 % |
| holder #2 (Safe 3/5) | 4,210.68 | ✗ `NotEnoughLiquidity()` | −19.2 % |
| holder #2 then #3 | 3,489.01 | ✗ | −33.0 % |
| largest holder of **another vault** (Vault Bridge WETH) | 3,318.75 | ✗ | −36.3 % |
| holder #2 exits Gauntlet WETH Prime, then this vault | 2,079.21 | ✗ | −60.1 % |

**Cushion before blockage (fork, bisection):** the holder can still exit fully if holder #2 withdraws first up to 1,736.990 WETH. At 1,736.991 the full exit reverts.

**Dependencies that change the risk (on-chain):**
- Both wstETH markets (99.8 % of the vault's supply) are priced **only** by the `wstETH/stETH exchange rate` adapter, so stETH = ETH is hard-coded. If stETH depegs on the market, the oracle does not see it: no liquidation, no recognised loss, and no repaid liquidity comes back.
- The cbBTC market is priced by an **oracle router** whose primary leg is `BTC / USD ÷ ETH / USD`. The `cbBTC / USD` feed only sits in the backup leg, behind a 2 % deviation challenge.
- 8 peer MetaMorpho vaults lend in the same markets. 100 % of borrower debt was identified on-chain. In the 94.5 % LLTV market, one borrower holds 79.4 % of the debt.

**Shocks:**

| Shock | Recognised vault loss | Economic shortfall (unrecognised) | Holder max withdraw after a run by holder #2 + Vault Bridge #1 |
|---|---:|---:|---:|
| Lido backing loss −10 % (oracle sees it), executed: 90/90 liquidations | 293.106 WETH (analytic 293.084) | — | 5,052.78 (liquidations repay debt and bring liquidity back) |
| stETH market depeg −10 % (oracle blind), executed: 0 liquidatable | 0 | ≈910 WETH (analytic) | **582.53 (−89 %)** |

**Verdict (defaults: p = 5 %, 30 days, locked funds valued at a 10 % haircut):** in the oracle-blind incident, EXIT is the answer as soon as the holder's own incident probability exceeds **0.69 %** over 30 days. Sensitivity runs from 0.05 % (7 days, 50 % haircut) to 4.0 % (90 days, no haircut). In the Lido-loss incident, the break-even is 4.16 %.

Discovery also runs on other V1 vaults: Steakhouse USDC (99 nodes, 13 peer vaults, 1,568 reads) and Gauntlet WETH Prime (50 nodes).

## Run it

Requirements: Node 24, Windows/macOS/Linux. No API key is needed: the default upstream is `https://eth.drpc.org`. To use your own archive RPC, set `EXITPROOF_RPC_URL`; it is never written to disk or committed.

```bash
npm install
npm run proxy            # terminal 1: local RPC proxy on 127.0.0.1:8600 (online)
npm run fork             # terminal 2: Hardhat 3 fork of block 26,157,638 through the proxy
npm run discover         # dependency graph -> results/discovery/<vault>.json  (any V1 vault: npm run discover -- 0x...)
npm run build:report     # scenarios, cushion, shocks, verdict -> results/report.json + results/manifest.json
npm run replay           # wei-exact replay of the manifest
npm run api              # terminal 3: local API on 127.0.0.1:8700
npm run web              # terminal 4: UI on http://127.0.0.1:5173
```

**Offline:** once the cache is warm (one online run), stop the proxy, start `npm run proxy:offline`, restart the fork, then run `npm run replay`. Discovery also runs offline with `EXITPROOF_OFFLINE=1` (Morpho API answers are cached too). The proxy logs every request it refuses in `cache/proxy.log`.

## Architecture

| Module | Role |
|---|---|
| `src/proxy/rpcProxy.ts` | Local JSON-RPC proxy. Hardhat's fork cache is keyed by host:port, so the fork always goes through `127.0.0.1:8600`. The proxy keeps a disk cache of deterministic requests (explicit block, including reverts) and runs online or offline. |
| `src/engine/fork.ts` | Snapshot (id persisted between processes), impersonation + `setBalance`, `evm_setNextBlockTimestamp(T0+12k)`, raw JSON-RPC to keep revert data, error decoding |
| `src/engine/scenario.ts` | Declarative scenarios: exits, oracle override (constant-returning bytecode), liquidate-all, measurements |
| `src/engine/cushion.ts` | Bisection executed on the fork |
| `src/discovery/` | Provenance-tracking reader, layered discovery, Morpho API candidate lists (verified on-chain) |
| `src/shocks/analytic.ts` | Propagation over the graph (bad debt with Morpho's liquidation incentive factor, hidden shortfall, overpricing) |
| `src/verdict/verdict.ts` | Break-even and decision; the UI imports this same file |
| `src/report/build.ts`, `src/cli/replay.ts` | Pipeline, manifest, replay |
| `src/server/server.ts`, `web/` | Local API (live fork runs, replay) and React UI |

## What works / partial / excluded

- **Works:** everything above for Steakhouse ETH. Discovery for any MetaMorpho V1.0/V1.1 vault. Wei-exact replay online and offline.
- **Partial:**
  - Exit and shock *execution* uses a catalog of holders chosen for Steakhouse ETH; other vaults get discovery and analytic shocks only.
  - Live shock execution is implemented for WETH-loan markets only (the liquidator is funded in WETH).
  - Peer vaults and borrowers are *enumerated* from Morpho's public API, because the free archive RPC does not serve historical `eth_getLogs`. Every candidate is re-read on-chain and completeness is measured on-chain.
  - Allocators other than the Public Allocator are not enumerated.
- **Excluded:**
  - MetaMorpho V2 and other vault types, which are refused explicitly (their `max*` semantics differ).
  - USD values: native units only.
  - Liquidation capacity limits (DEX depth for seized collateral): the "liquidations work" regime assumes liquidators absorb everything. The oracle-blind regime is the other bound.
  - Anything after the frozen block: ExitProof describes one state, not its evolution.

## Assumptions and honesty

- No transaction is ever sent to Ethereum: only reads on the RPC, and `eth_sendTransaction` on the local node.
- Impersonated actors are a scenario hypothesis, not their signature or intention. The largest holder's contract reports a name; it is not verified and is not used.
- The cross-vault exit mechanism is already documented (e.g. LlamaRisk's Morpho vault risk disclaimer, articles on shared markets). ExitProof's contribution is to **execute** it and put a number on it for one position at one block, with a replay.
- The economic shortfall of an oracle-blind depeg assumes the depeg persists and underwater borrowers walk away. It is not a loss recognised on-chain and is labelled as such.

## Origine des composants (component origin)

- **Written during the event (10–11 Oct 2026):** all code in this repository: proxy, fork engine, scenarios, discovery, shocks, verdict, report, replay, API and UI. It was written from scratch in a fresh repository (see the git history).
- **Prior preparation (night of 9–10 Oct 2026):** desk research and a throwaway feasibility check, kept in a separate research folder that is **not** included here. That check covered RPC archive availability, whether a Hardhat 3 fork works at this block, and the reference values for this vault and block. Only **facts** were reused: public addresses, block number and hash, and the reference amounts used as acceptance tests. Its code was not copied.
- **Libraries (all via npm):**
  - viem 2.57.4 (MIT), Hardhat 3.19.0 (MIT), React / React-DOM 19.3.0 (MIT), Vite 8.3.4 (MIT), @vitejs/plugin-react 6.1.2 (MIT), tsx 4.23.15 (MIT), TypeScript 7.0.2 (Apache-2.0)
  - Data sources: Ethereum archive RPC (dRPC public endpoint) and Morpho public GraphQL API, used for candidate lists only.
- **AI assistance:** the code was written with Claude Code (Anthropic), working with the team member who directed the work and reviewed the results. No AI is used in any computation of the tool.

## License

MIT
