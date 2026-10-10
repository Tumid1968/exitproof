/** The exit word: how easily a position gets out in the worst executed case (not advice). Limits are a stated choice. */
export const ANSWER_LIMITS = { safe: 0.9, careful: 0.5 } as const;
export function answerWord(aloneFull: boolean, worstShare: number) {
  return !aloneFull || worstShare < ANSWER_LIMITS.careful ? "Hard exit" : worstShare < ANSWER_LIMITS.safe ? "Tight exit" : "Easy exit";
}
/** colour level of the word (same thresholds) */
export function answerLevel(aloneFull: boolean, worstShare: number) {
  return ({ "Easy exit": "easy", "Tight exit": "tight", "Hard exit": "hard" } as const)[answerWord(aloneFull, worstShare)];
}
