import { z } from "zod";
import { CampaignId, CharacterId } from "./ids";
import { PowerTagSchema, WeaknessTagSchema } from "./tag";

/**
 * Fellowship Theme: structurally similar to a regular theme, but without
 * mightLevel/type since the fellowship doesn't progress through Origin →
 * Adventure → Greatness the same way a personal theme does. Lives on the
 * campaign doc, shared by every party member.
 */
export const FellowshipThemeSchema = z.object({
  name: z.string().min(1).max(60),
  quest: z.string().max(200).default(""),
  powerTags: z.array(PowerTagSchema).max(12),
  weaknessTag: WeaknessTagSchema,
  specialImprovements: z.array(z.string().max(120)).max(12),
  tracks: z.object({
    improve: z.number().int().min(0).max(3),
    milestone: z.number().int().min(0).max(3),
    abandon: z.number().int().min(0).max(3),
  }),
});
export type FellowshipTheme = z.infer<typeof FellowshipThemeSchema>;

export const CampaignRosterEntrySchema = z.object({
  characterId: CharacterId,
  characterName: z.string().min(1).max(60),
  playerUid: z.string().min(1),
  avatarUrl: z.string().url().nullable(),
  joinedAt: z.string().datetime(),
});
export type CampaignRosterEntry = z.infer<typeof CampaignRosterEntrySchema>;

export const CampaignSchema = z.object({
  id: CampaignId,
  name: z.string().min(1).max(80),
  gmUid: z.string().min(1),
  fellowship: FellowshipThemeSchema,
  roster: z.array(CampaignRosterEntrySchema).max(8),
  characterIds: z.array(CharacterId).max(8),
  // Denormalized list of player UIDs — kept in sync with `roster` so
  // Firestore security rules can do a constant-time `request.auth.uid in
  // resource.data.playerUids` check (rules can't `.map()` over an array of
  // objects). Maintained by createCampaign/joinCampaign/leaveCampaign.
  playerUids: z.array(z.string().min(1)).max(8),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

export const CampaignSummarySchema = z.object({
  id: CampaignId,
  name: z.string(),
  gmUid: z.string(),
  rosterCount: z.number().int().min(0),
});
export type CampaignSummary = z.infer<typeof CampaignSummarySchema>;
