import type { Hex } from "viem";

export type DecodedError = { selector: Hex | null; name: string; meaning: string; raw: string };

/** Only selectors actually observed on the fork are given a human meaning; anything else stays raw. */
const KNOWN: Record<string, { name: string; meaning: string }> = {
  "0x4323a555": {
    name: "NotEnoughLiquidity()",
    meaning: "Not enough liquidity in the vault's markets at this instant",
  },
  "0xe450d38c": {
    name: "ERC20InsufficientBalance(address,uint256,uint256)",
    meaning: "More shares requested than the owner holds",
  },
  "0xfb8f41b2": {
    name: "ERC20InsufficientAllowance(address,uint256,uint256)",
    meaning: "Caller is not allowed to withdraw on behalf of this owner",
  },
};

export function decodeRevert(data: Hex | undefined, message: string): DecodedError {
  if (!data || data.length < 10) return { selector: null, name: "unknown", meaning: "No revert data: " + message, raw: message };
  const selector = data.slice(0, 10).toLowerCase() as Hex;
  const k = KNOWN[selector];
  return k
    ? { selector, ...k, raw: data }
    : { selector, name: "unrecognised", meaning: "Unrecognised revert, shown raw (no cause invented)", raw: data };
}
