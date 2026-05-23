import type {
  CampaignId,
  Challenge,
  ChallengeId,
  ChallengeRole,
  FellowshipTheme,
  MightLevel,
} from "../schemas";
import { TagId } from "../schemas";

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

/**
 * Build a blank Challenge stat block. `createdAt` / `updatedAt` are inserted
 * server-side as serverTimestamps; the createChallenge action overwrites the
 * ISO placeholders provided here so the schema parses on read-back.
 */
export function buildBlankChallenge(params: {
  id: ChallengeId;
  campaignId: CampaignId;
  name: string;
  role: ChallengeRole;
  mightLevel: MightLevel;
}): Challenge {
  const nowIso = new Date().toISOString();
  return {
    id: params.id,
    campaignId: params.campaignId,
    name: params.name,
    concept: "",
    role: params.role,
    mightLevel: params.mightLevel,
    tags: [],
    statuses: [],
    limits: [],
    threats: [],
    notes: "",
    engaged: false,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}
