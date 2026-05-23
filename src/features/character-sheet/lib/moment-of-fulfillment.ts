import type { MomentOfFulfillmentPath } from "../schemas";

interface ChoiceLike {
  kind: MomentOfFulfillmentPath;
  text?: string;
}

/**
 * Build a one-line human summary for the Moment-of-Fulfillment success toast.
 * Suffix appended when burned tags were restored alongside the chosen path.
 */
export function buildSummaryMessage(
  choice: ChoiceLike,
  burnedTagsRestored: number,
): string {
  let base: string;
  switch (choice.kind) {
    case "retire":
      base = "Your hero rests, story complete.";
      break;
    case "reforge":
      base = "Reforged. Begin anew.";
      break;
    case "gainQuintessence":
      base = `Quintessence gained: ${choice.text ?? "(unnamed)"}`;
      break;
    case "shakeWorld":
      base = "The world shifts.";
      break;
    case "speakWordsEternal":
      base = "Words spoken, fated to endure.";
      break;
    case "unearthTruths":
      base = "A profound truth surfaces.";
      break;
  }
  if (burnedTagsRestored > 0) {
    base += ` · ${burnedTagsRestored} burned tag${
      burnedTagsRestored === 1 ? "" : "s"
    } restored`;
  }
  return base;
}
