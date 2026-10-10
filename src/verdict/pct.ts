/** Percentage change a → b, rounded half away from zero at dp decimals, exact on bigint amounts. */
export function pctChange(a: bigint, b: bigint, dp = 2): number {
  if (b === 0n) return 0;
  const num = (a - b) * 10n ** BigInt(dp + 2);
  let q = num / b;
  const r = num % b;
  const abs = (x: bigint) => (x < 0n ? -x : x);
  if (2n * abs(r) >= abs(b)) q += (num < 0n) !== (b < 0n) ? -1n : 1n;
  return Number(q) / 10 ** dp;
}
