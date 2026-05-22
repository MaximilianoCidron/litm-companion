import { TagId, type FellowshipTheme } from "../schemas";

/**
 * Build a blank Fellowship Theme. Used by createCampaign when no fellowship
 * has been authored yet. Quest, tags, and improvements start empty; the GM
 * fills them in during play.
 */
export function buildBlankFellowship(name: string): FellowshipTheme {
  return {
    name,
    quest: "",
    powerTags: [],
    weaknessTag: {
      id: TagId.parse(crypto.randomUUID()),
      name: "",
    },
    specialImprovements: [],
    tracks: { improve: 0, milestone: 0, abandon: 0 },
  };
}
