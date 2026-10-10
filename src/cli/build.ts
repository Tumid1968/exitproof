/** Usage: tsx src/cli/build.ts [vault] [holder]   (default: Steakhouse ETH, its largest holder) */
import type { Address } from "viem";
import { buildReport } from "../report/build.ts";
import { ACTORS } from "../lib/constants.ts";

const [vault, holder] = process.argv.slice(2).filter((a) => a.startsWith("0x")) as Address[];
const t0 = Date.now();
await buildReport(vault ?? ACTORS.steakhouseEth, holder);
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
