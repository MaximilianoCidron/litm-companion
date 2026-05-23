import { z } from "zod";
import {
  CampaignId,
  ChallengeId,
  CharacterId,
  PendingThreatId,
  TagId,
  ThreatId,
} from "./ids";
import { TagLocationSchema } from "./roll";

// Only applyStatus and scratchTag are reaction-eligible. Other consequence
// kinds bypass the pendingThreat flow entirely.
export const PendingConsequenceSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("applyStatus"),
    statusName: z.string().min(1).max(40),
    tier: z.number().int().min(1).max(6),
    polarity: z.enum(["helpful", "hindering"]),
  }),
  z.object({
    kind: z.literal("scratchTag"),
    location: TagLocationSchema,
    tagId: TagId,
    tagName: z.string().min(1).max(60),
  }),
]);
export type PendingConsequence = z.infer<typeof PendingConsequenceSchema>;

export const PendingThreatStatusSchema = z.enum([
  "awaitingReaction",
  "reactionRolled",
  "resolved",
  "canceled",
]);
export type PendingThreatStatus = z.infer<typeof PendingThreatStatusSchema>;

export const PendingThreatResolutionSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("pending") }),
  z.object({ kind: z.literal("acceptedFull") }),
  z.object({
    kind: z.literal("tierReduction"),
    powerSpent: z.number().int().min(0).max(6),
    tiersReduced: z.number().int().min(0).max(6),
    finalTier: z.number().int().min(0).max(6),
  }),
  z.object({ kind: z.literal("tagPreserved"), powerSpent: z.literal(2) }),
  z.object({ kind: z.literal("tagScratched") }),
  z.object({ kind: z.literal("canceled") }),
]);
export type PendingThreatResolution = z.infer<
  typeof PendingThreatResolutionSchema
>;

export const PendingThreatSchema = z.object({
  id: PendingThreatId,
  campaignId: CampaignId,

  initiatedByUid: z.string().min(1),
  challengeId: ChallengeId,
  threatId: ThreatId,

  targetCharacterId: CharacterId,
  targetCharacterName: z.string(),
  targetUid: z.string().min(1),

  consequence: PendingConsequenceSchema,

  status: PendingThreatStatusSchema,

  reactionRollId: z.string().nullable().default(null),
  reactionPower: z.number().int().nullable().default(null),

  resolution: PendingThreatResolutionSchema.default({ kind: "pending" }),

  createdAt: z.string().datetime(),
  resolvedAt: z.string().datetime().nullable().default(null),
});
export type PendingThreat = z.infer<typeof PendingThreatSchema>;
