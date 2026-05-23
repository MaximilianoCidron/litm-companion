import { z } from "zod";
import {
  CampaignId,
  ChallengeId,
  CharacterId,
  FellowshipRelationshipId,
  PendingThreatId,
  RollId,
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
]);
export type TagLocation = z.infer<typeof TagLocationSchema>;

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
});
export type RollRecord = z.infer<typeof RollRecordSchema>;
