import { z } from "zod";
import {
  CampaignId,
  ChallengeId,
  LimitId,
  TagId,
  ThreatId,
} from "./ids";
import { StatusSchema } from "./status";
import { MightLevelSchema } from "./theme";

export const ChallengeRoleSchema = z.enum([
  "aggressor",
  "charge",
  "countdown",
  "influence",
  "mystery",
  "obstacle",
  "pursuer",
  "quarry",
  "sapper",
  "support",
  "watcher",
]);
export type ChallengeRole = z.infer<typeof ChallengeRoleSchema>;

export const CHALLENGE_ROLE_DESCRIPTIONS: Record<ChallengeRole, string> = {
  aggressor: "actively attacks targets",
  charge: "builds toward a big effect",
  countdown: "ticks down to a deadline",
  influence: "manipulates socially or magically",
  mystery: "investigative obstacle",
  obstacle: "passive blockage",
  pursuer: "chases targets",
  quarry: "is being chased",
  sapper: "drains resources",
  support: "aids another challenge",
  watcher: "observes and reports",
};

export const ChallengeTagSchema = z.object({
  id: TagId,
  name: z.string().min(1).max(60),
  polarity: z.enum(["helpful", "hindering"]),
  scratched: z.boolean(),
});
export type ChallengeTag = z.infer<typeof ChallengeTagSchema>;

export const ChallengeLimitSchema = z.object({
  id: LimitId,
  label: z.string().min(1).max(60),
  threshold: z.number().int().min(1).max(50),
  current: z.number().int().min(0).max(50),
});
export type ChallengeLimit = z.infer<typeof ChallengeLimitSchema>;

export const ConsequenceTemplateSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("applyStatus"),
    statusName: z.string().min(1).max(40),
    tier: z.number().int().min(1).max(6),
    polarity: z.enum(["helpful", "hindering"]),
  }),
  z.object({
    kind: z.literal("markTrack"),
    track: z.enum(["improve", "milestone", "abandon"]),
    delta: z.union([z.literal(-1), z.literal(1)]),
  }),
  z.object({
    kind: z.literal("scratchTag"),
    hint: z.string().max(120).optional(),
  }),
  z.object({
    kind: z.literal("custom"),
    description: z.string().min(1).max(280),
  }),
]);
export type ConsequenceTemplate = z.infer<typeof ConsequenceTemplateSchema>;

export const ChallengeThreatSchema = z.object({
  id: ThreatId,
  description: z.string().min(1).max(280),
  consequenceTemplate: ConsequenceTemplateSchema,
});
export type ChallengeThreat = z.infer<typeof ChallengeThreatSchema>;

export const ChallengeSchema = z.object({
  id: ChallengeId,
  campaignId: CampaignId,
  name: z.string().min(1).max(80),
  concept: z.string().max(280).default(""),
  role: ChallengeRoleSchema,
  mightLevel: MightLevelSchema,
  tags: z.array(ChallengeTagSchema).max(20),
  statuses: z.array(StatusSchema).max(20),
  limits: z.array(ChallengeLimitSchema).max(10),
  threats: z.array(ChallengeThreatSchema).max(20),
  notes: z.string().max(2000).default(""),
  // When true, a denormalized mirror at
  // `campaigns/{cid}/engagedChallenges/{cid}` exposes name + tags to players.
  // Legacy docs without the field parse as false.
  engaged: z.boolean().default(false),
  // Sub-toggles: tags are always exposed when engaged; statuses + limits opt-in.
  exposeStatuses: z.boolean().default(false),
  exposeLimits: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Challenge = z.infer<typeof ChallengeSchema>;

export const EngagedChallengeSchema = z.object({
  id: ChallengeId,
  campaignId: CampaignId,
  name: z.string().min(1).max(80),
  tags: z.array(ChallengeTagSchema).max(20),
  // Populated only when the source has exposeStatuses/exposeLimits true.
  // Defaults keep legacy mirrors (prompt 14) parseable.
  statuses: z.array(StatusSchema).max(20).default([]),
  limits: z.array(ChallengeLimitSchema).max(10).default([]),
  updatedAt: z.string().datetime(),
});
export type EngagedChallenge = z.infer<typeof EngagedChallengeSchema>;

export const ChallengeSummarySchema = z.object({
  id: ChallengeId,
  name: z.string(),
  role: ChallengeRoleSchema,
  mightLevel: MightLevelSchema,
  threatCount: z.number().int().min(0),
  limitCount: z.number().int().min(0),
});
export type ChallengeSummary = z.infer<typeof ChallengeSummarySchema>;
