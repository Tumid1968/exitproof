import { buildReport } from "../report/build.ts";
const t0 = Date.now();
await buildReport();
console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
