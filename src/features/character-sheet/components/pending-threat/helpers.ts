import type { PendingConsequence } from "../../schemas";

export function consequenceLabel(c: PendingConsequence): string {
  if (c.kind === "applyStatus") {
    return `${c.statusName}-${c.tier} ${c.polarity}`;
  }
  return `scratch "${c.tagName}"`;
}

export function clampReduction(
  desired: number,
  originalTier: number,
  reactionPower: number,
): number {
  return Math.max(0, Math.min(desired, originalTier, reactionPower));
}

export function previewFinalTier(
  originalTier: number,
  powerSpent: number,
): number {
  return Math.max(0, originalTier - powerSpent);
}
