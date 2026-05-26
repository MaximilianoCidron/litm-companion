import { z } from "zod";
import {
  CampaignId,
  ChallengeId,
  CharacterId,
  FellowshipRelationshipId,
  PendingThreatId,
  QuintessenceId,
  RollId,
  SessionId,
  StatusId,
  TagId,
  ThemeId,
} from "./ids";

export const TagLocationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("theme"), themeId: ThemeId }),
  z.object({ kind: z.literal("backpack") }),
  z.object({ kind: z.literal("fellowship"), campaignId: CampaignId }),
  z.object({
    kind: z.literal("relationship"),
    relationshipId: FellowshipRelationshipId,
  }),
  // Player invocation of an engaged challenge's tag. campaignId is kept on
  // the location for self-contained resolver lookups.
  z.object({
    kind: z.literal("challenge"),
    campaignId: CampaignId,
    challengeId: ChallengeId,
  }),
  // Quintessence — permanent +1 tag from a `gainQuintessence` MoF.
  // Scratches on invocation; refreshes on camp rest.
  z.object({
    kind: z.literal("quintessence"),
    quintessenceId: QuintessenceId,
  }),
]);
export type TagLocation = z.infer<typeof TagLocationSchema>;

export const StatusLocationSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("character") }),
  z.object({
    kind: z.literal("challenge"),
    campaignId: CampaignId,
    challengeId: ChallengeId,
  }),
]);
export type StatusLocation = z.infer<typeof StatusLocationSchema>;

export const ResolvedTagInvocationSchema = z.object({
  tagId: TagId,
  location: TagLocationSchema,
  name: z.string(),
  tagKind: z.enum(["power", "weakness", "story"]),
  polarity: z.enum(["helpful", "hindering"]),
  burned: z.boolean(),
  contribution: z.number().int(),
});
export type ResolvedTagInvocation = z.infer<typeof ResolvedTagInvocationSchema>;

export const ResolvedStatusInvocationSchema = z.object({
  statusId: StatusId,
  name: z.string(),
  tier: z.number().int().min(1).max(6),
  polarity: z.enum(["helpful", "hindering"]),
  contribution: z.number().int(),
  // Origin of the invoked status. Default for legacy roll records (pre-prompt 20)
  // is injected by `firestoreToRollRecord` so this schema reads non-default.
  location: StatusLocationSchema,
});
export type ResolvedStatusInvocation = z.infer<
  typeof ResolvedStatusInvocationSchema
>;

export const MightModifierSchema = z.union([
  z.literal(-6),
  z.literal(-3),
  z.literal(0),
  z.literal(3),
  z.literal(6),
]);
export type MightModifier = z.infer<typeof MightModifierSchema>;

export const RollTierSchema = z.enum(["success", "mixed", "failure"]);
export type RollTier = z.infer<typeof RollTierSchema>;

export const DetailedActionTargetSchema = z.object({
  campaignId: CampaignId,
  challengeId: ChallengeId,
  challengeName: z.string(),
});
export type DetailedActionTarget = z.infer<typeof DetailedActionTargetSchema>;

export const RollRecordSchema = z.object({
  id: RollId,
  characterId: CharacterId,
  createdBy: z.string().min(1),
  createdAt: z.string().datetime(),
  isReaction: z.boolean(),
  resolved: z.object({
    tags: z.array(ResolvedTagInvocationSchema),
    statuses: z.array(ResolvedStatusInvocationSchema),
  }),
  mightModifier: MightModifierSchema,
  d1: z.number().int().min(1).max(6),
  d2: z.number().int().min(1).max(6),
  power: z.number().int(),
  total: z.number().int(),
  tier: RollTierSchema.nullable(),
  // When this roll was a Reaction triggered by a pending threat, the link
  // is captured here. Legacy roll docs parse as null via the default.
  reactingTo: z
    .object({
      pendingThreatId: PendingThreatId,
    })
    .nullable()
    .default(null),
  // Tagged with active session at commit time. Pre-prompt-18 rolls parse
  // as null and don't appear in per-session collection-group queries.
  sessionId: SessionId.nullable().default(null),
  // Detailed action — player declares the roll as targeting a specific
  // engaged challenge, then allocates Power across its exposed limits in a
  // post-commit step. Mutually exclusive with isReaction. Legacy rolls
  // parse as false/null/false.
  isDetailedAction: z.boolean().default(false),
  detailedActionTarget: DetailedActionTargetSchema.nullable().default(null),
  limitAllocationApplied: z.boolean().default(false),
});
export type RollRecord = z.infer<typeof RollRecordSchema>;
