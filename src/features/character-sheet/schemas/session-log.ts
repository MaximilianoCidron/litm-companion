import { z } from "zod";
import {
  CampaignId,
  ChallengeId,
  CharacterId,
  LimitId,
  SessionId,
  SessionLogEntryId,
  ThemeId,
} from "./ids";
import { MomentOfFulfillmentPathSchema } from "./moment-of-fulfillment";

export const SessionLogDetailsSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("annotation") }),
  z.object({
    kind: z.literal("campAction"),
    activity: z.enum(["rest", "reflect", "campAction"]),
    themeId: ThemeId.optional(),
    themeName: z.string().optional(),
  }),
  z.object({
    kind: z.literal("deliverThreat"),
    // Challenge NAME is intentionally absent — only the id is kept for GM-side
    // navigation. UI must check role before rendering links.
    challengeId: ChallengeId,
    consequenceKind: z.enum([
      "applyStatus",
      "markTrack",
      "scratchTag",
      "custom",
    ]),
    consequenceSummary: z.string(),
  }),
  z.object({
    kind: z.literal("momentOfFulfillment"),
    path: MomentOfFulfillmentPathSchema,
    /** Path-specific human-readable summary appended to the entry text. */
    pathSnapshot: z.string().max(500),
  }),
  z.object({
    kind: z.literal("themeAdvancement"),
    advancementKind: z.enum(["evolve", "replace"]),
    themeId: ThemeId,
    themeName: z.string(),
    newMightLevel: z.enum(["origin", "adventure", "greatness"]).optional(),
  }),
  z.object({
    kind: z.literal("sessionBoundary"),
    boundary: z.enum(["start", "end"]),
    sessionNumber: z.number().int(),
    sessionId: SessionId,
  }),
  z.object({
    kind: z.literal("limitAdvancement"),
    challengeId: ChallengeId,
    // Safe to include — limits are GM-exposed when allocation occurs.
    challengeName: z.string(),
    limitId: LimitId,
    limitLabel: z.string(),
    powerSpent: z.number().int().min(1).max(50),
    previousCurrent: z.number().int().min(0).max(50),
    newCurrent: z.number().int().min(0).max(50),
    threshold: z.number().int().min(1).max(50),
    overcame: z.boolean(),
  }),
  z.object({
    kind: z.literal("bulkCleanup"),
    operations: z.object({
      unscratchPowerTags: z.boolean(),
      clearHinderingStatuses: z.boolean(),
      discardStoryTags: z.boolean(),
      unburnPowerTags: z.boolean(),
      refreshFellowshipTags: z.boolean(),
      refreshChallengeTags: z.boolean(),
    }),
    counts: z.object({
      affectedCharacterCount: z.number().int().min(0),
      powerTagsUnscratched: z.number().int().min(0),
      powerTagsUnburned: z.number().int().min(0),
      hinderingStatusesCleared: z.number().int().min(0),
      storyTagsDiscarded: z.number().int().min(0),
      fellowshipTagsRefreshed: z.number().int().min(0),
      engagedChallengeTagsRefreshed: z.number().int().min(0),
    }),
  }),
]);
export type SessionLogDetails = z.infer<typeof SessionLogDetailsSchema>;

export const SessionLogEntrySchema = z.object({
  id: SessionLogEntryId,
  campaignId: CampaignId,

  authorUid: z.string().min(1),
  authorName: z.string().min(1),

  subjectCharacterId: CharacterId.nullable(),
  subjectCharacterName: z.string().nullable(),

  text: z.string().min(1).max(2000),
  details: SessionLogDetailsSchema,

  pinned: z.boolean().default(false),
  // Tagged with the active session at write time. Pre-feature entries
  // parse as null and don't appear in session-scoped views.
  sessionId: SessionId.nullable().default(null),
  createdAt: z.string().datetime(),
});
export type SessionLogEntry = z.infer<typeof SessionLogEntrySchema>;
