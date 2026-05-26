import { z } from "zod";
import {
  CampaignId,
  ChallengeId,
  CharacterId,
  FellowshipRelationshipId,
  InvitationId,
  LimitId,
  MomentOfFulfillmentEntryId,
  PendingThreatId,
  QuintessenceId,
  SessionLogEntryId,
  StatusId,
  TagId,
  ThemeId,
  ThreatId,
} from "./ids";
import { MightLevelSchema, ThemeTypeSchema } from "./theme";
import {
  MightModifierSchema,
  StatusLocationSchema,
  TagLocationSchema,
} from "./roll";
import {
  ChallengeRoleSchema,
  ConsequenceTemplateSchema,
} from "./challenge";
import { ThemePreferenceSchema } from "./user-settings";

export const CreateCharacterInput = z.object({
  name: z.string().min(1).max(60),
  concept: z.string().max(120).default(""),
  campaignId: CampaignId.optional(),
});
export type CreateCharacterInput = z.infer<typeof CreateCharacterInput>;

export const UpdateTagInput = z.object({
  // characterId is required for theme/backpack patches; for fellowship patches
  // the campaignId is the routing key, but we keep characterId in the wire shape
  // so the access middleware can still verify the caller has an associated
  // character (and to keep all UpdateTag invocations symmetrical).
  characterId: CharacterId,
  location: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("theme"), themeId: ThemeId, tagId: TagId }),
    z.object({ kind: z.literal("backpack"), tagId: TagId }),
    z.object({
      kind: z.literal("fellowship"),
      campaignId: CampaignId,
      tagId: TagId,
    }),
    z.object({
      kind: z.literal("quintessence"),
      quintessenceId: QuintessenceId,
    }),
  ]),
  patch: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("rename"),
      name: z.string().min(1).max(120),
    }),
    z.object({
      kind: z.literal("scratch"),
      scratched: z.boolean(),
    }),
    z.object({
      kind: z.literal("setPreserved"),
      preserved: z.boolean(),
    }),
  ]),
});
export type UpdateTagInput = z.infer<typeof UpdateTagInput>;

export const BurnTagInput = z.object({
  characterId: CharacterId,
  themeId: ThemeId,
  tagId: TagId,
});
export type BurnTagInput = z.infer<typeof BurnTagInput>;

export const UnburnTagInput = z.object({
  characterId: CharacterId,
  themeId: ThemeId,
  tagId: TagId,
});
export type UnburnTagInput = z.infer<typeof UnburnTagInput>;

export const ResolveMomentOfFulfillmentInput = z.object({
  characterId: CharacterId,
  resolution: z.discriminatedUnion("path", [
    z.object({
      path: z.literal("retire"),
      finalWords: z.string().max(2000).default(""),
    }),
    z.object({
      path: z.literal("reforge"),
      themeIdToReplace: ThemeId,
      newThemeName: z.string().min(1).max(120),
      newThemeType: ThemeTypeSchema,
      newQuest: z.string().max(200).default(""),
      narrativeDescription: z.string().max(2000).default(""),
    }),
    z.object({
      path: z.literal("gainQuintessence"),
      quintessenceName: z.string().min(1).max(120),
      narrativeDescription: z.string().max(2000).default(""),
    }),
    z.object({
      path: z.literal("shakeWorld"),
      narrativeDescription: z.string().min(1).max(2000),
    }),
    z.object({
      path: z.literal("speakWordsEternal"),
      themeId: ThemeId,
      newPowerTagName: z.string().min(1).max(120),
      narrativeDescription: z.string().max(2000).default(""),
    }),
    z.object({
      path: z.literal("unearthTruths"),
      narrativeDescription: z.string().min(1).max(2000),
    }),
  ]),
});
export type ResolveMomentOfFulfillmentInput = z.infer<
  typeof ResolveMomentOfFulfillmentInput
>;

// Internal: invoked by the gainQuintessence MoF path AND testable on its
// own. Not exposed via UI in v1 — no manual quintessence-add affordance.
export const AddQuintessenceInput = z.object({
  characterId: CharacterId,
  name: z.string().min(1).max(120),
  sourceMoFEntryId: MomentOfFulfillmentEntryId,
});
export type AddQuintessenceInput = z.infer<typeof AddQuintessenceInput>;

// Defensive cleanup affordance. Not exposed in v1 UI; ownership-gated.
export const RemoveQuintessenceInput = z.object({
  characterId: CharacterId,
  quintessenceId: QuintessenceId,
});
export type RemoveQuintessenceInput = z.infer<typeof RemoveQuintessenceInput>;

export const ApplyStatusInput = z.object({
  characterId: CharacterId,
  status: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("add"),
      name: z.string().min(1).max(40),
      tier: z.number().int().min(1).max(6),
      polarity: z.enum(["helpful", "hindering"]),
    }),
    z.object({
      kind: z.literal("setTier"),
      statusId: StatusId,
      tier: z.number().int().min(1).max(6),
    }),
    z.object({
      kind: z.literal("rename"),
      statusId: StatusId,
      name: z.string().min(1).max(40),
    }),
    z.object({
      kind: z.literal("clear"),
      statusId: StatusId,
    }),
  ]),
});
export type ApplyStatusInput = z.infer<typeof ApplyStatusInput>;

export const MarkTrackInput = z.object({
  characterId: CharacterId,
  themeId: ThemeId,
  track: z.enum(["improve", "milestone", "abandon"]),
  delta: z.union([z.literal(1), z.literal(-1)]),
});
export type MarkTrackInput = z.infer<typeof MarkTrackInput>;

export const UpdateThemeInput = z.object({
  characterId: CharacterId,
  themeId: ThemeId,
  patch: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("rename"), name: z.string().min(1).max(60) }),
    z.object({ kind: z.literal("retype"), type: ThemeTypeSchema }),
    z.object({ kind: z.literal("setQuest"), quest: z.string().max(200) }),
  ]),
});
export type UpdateThemeInput = z.infer<typeof UpdateThemeInput>;

export const AddPowerTagInput = z.object({
  characterId: CharacterId,
  themeId: ThemeId,
  name: z.string().min(1).max(60),
});
export type AddPowerTagInput = z.infer<typeof AddPowerTagInput>;

export const RemovePowerTagInput = z.object({
  characterId: CharacterId,
  themeId: ThemeId,
  tagId: TagId,
});
export type RemovePowerTagInput = z.infer<typeof RemovePowerTagInput>;

export const MutateSpecialImprovementsInput = z.object({
  characterId: CharacterId,
  themeId: ThemeId,
  op: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("add"), text: z.string().min(1).max(120) }),
    z.object({
      kind: z.literal("remove"),
      index: z.number().int().nonnegative(),
    }),
    z.object({
      kind: z.literal("edit"),
      index: z.number().int().nonnegative(),
      text: z.string().min(1).max(120),
    }),
  ]),
});
export type MutateSpecialImprovementsInput = z.infer<
  typeof MutateSpecialImprovementsInput
>;

export const ClaimImprovementInput = z.object({
  characterId: CharacterId,
  themeId: ThemeId,
  choice: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("addTag"),
      name: z.string().min(1).max(60),
    }),
    z.object({
      kind: z.literal("replaceWeakness"),
      name: z.string().min(1).max(60),
    }),
    z.object({
      kind: z.literal("addImprovement"),
      text: z.string().min(1).max(120),
    }),
  ]),
});
export type ClaimImprovementInput = z.infer<typeof ClaimImprovementInput>;

export const EvolveThemeInput = z.object({
  characterId: CharacterId,
  themeId: ThemeId,
  newType: ThemeTypeSchema.optional(),
  newName: z.string().min(1).max(60).optional(),
});
export type EvolveThemeInput = z.infer<typeof EvolveThemeInput>;

export const ReplaceThemeInput = z.object({
  characterId: CharacterId,
  themeId: ThemeId,
  newName: z.string().min(1).max(60),
  newType: ThemeTypeSchema,
  newQuest: z.string().max(200).default(""),
});
export type ReplaceThemeInput = z.infer<typeof ReplaceThemeInput>;

export const TagInvocationInputSchema = z.object({
  tagId: TagId,
  location: TagLocationSchema,
  burn: z.boolean().default(false),
});
export type TagInvocationInput = z.infer<typeof TagInvocationInputSchema>;

export const StatusInvocationInputSchema = z.object({
  statusId: StatusId,
  location: StatusLocationSchema,
});
export type StatusInvocationInput = z.infer<typeof StatusInvocationInputSchema>;

export const CommitRollInput = z.object({
  characterId: CharacterId,
  isReaction: z.boolean().default(false),
  invocations: z.object({
    tags: z.array(TagInvocationInputSchema).max(20),
    statuses: z.array(StatusInvocationInputSchema).max(10),
  }),
  mightModifier: MightModifierSchema,
  // When this roll resolves a pending threat, the link is captured here.
  // commit-roll validates: requires isReaction === true AND the caller is
  // the targetUid of the pending threat.
  reactingTo: z
    .object({
      pendingThreatId: PendingThreatId,
      campaignId: CampaignId,
    })
    .optional(),
  // Detailed action — player declares this roll as targeting a specific
  // engaged challenge for limit advancement. Mutually exclusive with
  // isReaction; commit-roll validates the pair.
  isDetailedAction: z.boolean().default(false),
  detailedActionTarget: z
    .object({
      campaignId: CampaignId,
      challengeId: ChallengeId,
    })
    .nullable()
    .default(null),
});
export type CommitRollInput = z.infer<typeof CommitRollInput>;

// Hand-written partial WITHOUT defaults — using
// `UserSettingsSchema.omit(...).partial()` keeps each field's `.default(...)`
// and Zod fills missing keys with defaults at parse time, which causes a
// merge write to overwrite untouched fields with defaults. We want only the
// keys the caller actually sent.
export const UpdateUserSettingsInput = z.object({
  patch: z.object({
    hidePresence: z.boolean().optional(),
    themePreference: ThemePreferenceSchema.optional(),
    showRetiredCharacters: z.boolean().optional(),
    confirmBeforeRolling: z.boolean().optional(),
    showInvitationToasts: z.boolean().optional(),
    showPendingThreatToasts: z.boolean().optional(),
    lastInboxOpenedAt: z.string().datetime().nullable().optional(),
  }),
});
export type UpdateUserSettingsInput = z.infer<typeof UpdateUserSettingsInput>;

export const BulkCleanupCampaignInput = z.object({
  campaignId: CampaignId,
  operations: z
    .object({
      unscratchPowerTags: z.boolean().default(false),
      clearHinderingStatuses: z.boolean().default(false),
      discardStoryTags: z.boolean().default(false),
      unburnPowerTags: z.boolean().default(false),
      refreshFellowshipTags: z.boolean().default(false),
      refreshChallengeTags: z.boolean().default(false),
    })
    .refine((ops) => Object.values(ops).some((v) => v === true), {
      message: "At least one operation must be selected.",
    }),
});
export type BulkCleanupCampaignInput = z.infer<
  typeof BulkCleanupCampaignInput
>;

export const GetCampaignCleanupPreviewInput = z.object({
  campaignId: CampaignId,
});
export type GetCampaignCleanupPreviewInput = z.infer<
  typeof GetCampaignCleanupPreviewInput
>;

export const UpdateDisplayNameInput = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, "Display name can't be empty.")
    .max(50, "Display name can't be longer than 50 characters.")
    .refine(
      (s) => !/[\n\r]/.test(s),
      "Display name can't contain line breaks.",
    ),
});
export type UpdateDisplayNameInput = z.infer<typeof UpdateDisplayNameInput>;

export const SetCharacterAvatarInput = z.object({
  characterId: CharacterId,
  mainUrl: z.string().url(),
  thumbUrl: z.string().url(),
});
export type SetCharacterAvatarInput = z.infer<typeof SetCharacterAvatarInput>;

export const RemoveCharacterAvatarInput = z.object({
  characterId: CharacterId,
});
export type RemoveCharacterAvatarInput = z.infer<
  typeof RemoveCharacterAvatarInput
>;

export const AllocateLimitProgressInput = z.object({
  rollId: z.string().min(1),
  characterId: CharacterId,
  campaignId: CampaignId,
  challengeId: ChallengeId,
  allocations: z
    .array(
      z.object({
        limitId: LimitId,
        powerSpent: z.number().int().min(1).max(50),
      }),
    )
    .min(0)
    .max(10),
});
export type AllocateLimitProgressInput = z.infer<
  typeof AllocateLimitProgressInput
>;

export const AddStoryTagInput = z.object({
  characterId: CharacterId,
  name: z.string().min(1).max(60),
  polarity: z.enum(["helpful", "hindering"]),
  isSingleUse: z.boolean(),
});
export type AddStoryTagInput = z.infer<typeof AddStoryTagInput>;

export const RemoveStoryTagInput = z.object({
  characterId: CharacterId,
  tagId: TagId,
});
export type RemoveStoryTagInput = z.infer<typeof RemoveStoryTagInput>;

export const UpdateBackpackNotesInput = z.object({
  characterId: CharacterId,
  notes: z.string().max(2000),
});
export type UpdateBackpackNotesInput = z.infer<typeof UpdateBackpackNotesInput>;

export const CreateCampaignInput = z.object({
  name: z.string().min(1).max(80),
  joinCharacterId: CharacterId.optional(),
});
export type CreateCampaignInput = z.infer<typeof CreateCampaignInput>;

export const JoinCampaignInput = z.object({
  characterId: CharacterId,
  campaignId: CampaignId,
});
export type JoinCampaignInput = z.infer<typeof JoinCampaignInput>;

export const LeaveCampaignInput = z.object({
  characterId: CharacterId,
  campaignId: CampaignId,
});
export type LeaveCampaignInput = z.infer<typeof LeaveCampaignInput>;

export const CreateInvitationInput = z.object({
  campaignId: CampaignId,
  expiresInDays: z.number().int().min(1).max(30).default(7),
});
export type CreateInvitationInput = z.infer<typeof CreateInvitationInput>;

export const RevokeInvitationInput = z.object({
  invitationId: InvitationId,
});
export type RevokeInvitationInput = z.infer<typeof RevokeInvitationInput>;

export const RedeemInvitationInput = z.object({
  invitationId: InvitationId,
  characterId: CharacterId,
});
export type RedeemInvitationInput = z.infer<typeof RedeemInvitationInput>;

export const CreateDirectedInvitationInput = z.object({
  campaignId: CampaignId,
  targetEmail: z.string().email(),
});
export type CreateDirectedInvitationInput = z.infer<
  typeof CreateDirectedInvitationInput
>;

export const RedeemDirectedInvitationInput = z.object({
  invitationId: InvitationId,
  characterId: CharacterId,
});
export type RedeemDirectedInvitationInput = z.infer<
  typeof RedeemDirectedInvitationInput
>;

export const DeclineDirectedInvitationInput = z.object({
  invitationId: InvitationId,
});
export type DeclineDirectedInvitationInput = z.infer<
  typeof DeclineDirectedInvitationInput
>;

export const KickFromCampaignInput = z.object({
  campaignId: CampaignId,
  characterId: CharacterId,
});
export type KickFromCampaignInput = z.infer<typeof KickFromCampaignInput>;

export const TransferGmInput = z.object({
  campaignId: CampaignId,
  newGmUid: z.string().min(1),
});
export type TransferGmInput = z.infer<typeof TransferGmInput>;

export const RenameCampaignInput = z.object({
  campaignId: CampaignId,
  name: z.string().min(1).max(80),
});
export type RenameCampaignInput = z.infer<typeof RenameCampaignInput>;

export const MutateFellowshipInput = z.object({
  campaignId: CampaignId,
  op: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("setName"),
      name: z.string().min(1).max(60),
    }),
    z.object({
      kind: z.literal("setQuest"),
      quest: z.string().max(200),
    }),
    z.object({
      kind: z.literal("addPowerTag"),
      name: z.string().min(1).max(60),
    }),
    z.object({
      kind: z.literal("removePowerTag"),
      tagId: TagId,
    }),
    z.object({
      kind: z.literal("renameWeakness"),
      name: z.string().min(1).max(60),
    }),
    z.object({
      kind: z.literal("markTrack"),
      track: z.enum(["improve", "milestone", "abandon"]),
      delta: z.union([z.literal(-1), z.literal(1)]),
    }),
    z.object({
      kind: z.literal("addImprovement"),
      text: z.string().min(1).max(120),
    }),
    z.object({
      kind: z.literal("removeImprovement"),
      index: z.number().int().nonnegative(),
    }),
    z.object({
      kind: z.literal("editImprovement"),
      index: z.number().int().nonnegative(),
      text: z.string().min(1).max(120),
    }),
    z.object({ kind: z.literal("refreshTags") }),
  ]),
});
export type MutateFellowshipInput = z.infer<typeof MutateFellowshipInput>;

export const CreateChallengeInput = z.object({
  campaignId: CampaignId,
  name: z.string().min(1).max(80),
  role: ChallengeRoleSchema,
  mightLevel: MightLevelSchema,
});
export type CreateChallengeInput = z.infer<typeof CreateChallengeInput>;

export const DeleteChallengeInput = z.object({
  challengeId: ChallengeId,
  campaignId: CampaignId,
});
export type DeleteChallengeInput = z.infer<typeof DeleteChallengeInput>;

export const MutateChallengeInput = z.object({
  challengeId: ChallengeId,
  campaignId: CampaignId,
  op: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("setName"), name: z.string().min(1).max(80) }),
    z.object({ kind: z.literal("setConcept"), concept: z.string().max(280) }),
    z.object({ kind: z.literal("setRole"), role: ChallengeRoleSchema }),
    z.object({ kind: z.literal("setMightLevel"), mightLevel: MightLevelSchema }),
    z.object({ kind: z.literal("setNotes"), notes: z.string().max(2000) }),

    z.object({
      kind: z.literal("addTag"),
      name: z.string().min(1).max(60),
      polarity: z.enum(["helpful", "hindering"]),
    }),
    z.object({ kind: z.literal("removeTag"), tagId: TagId }),
    z.object({
      kind: z.literal("renameTag"),
      tagId: TagId,
      name: z.string().min(1).max(60),
    }),
    z.object({ kind: z.literal("toggleTagScratch"), tagId: TagId }),

    z.object({
      kind: z.literal("addStatus"),
      name: z.string().min(1).max(40),
      tier: z.number().int().min(1).max(6),
      polarity: z.enum(["helpful", "hindering"]),
    }),
    z.object({ kind: z.literal("removeStatus"), statusId: StatusId }),
    z.object({
      kind: z.literal("setStatusTier"),
      statusId: StatusId,
      tier: z.number().int().min(1).max(6),
    }),
    z.object({
      kind: z.literal("renameStatus"),
      statusId: StatusId,
      name: z.string().min(1).max(40),
    }),

    z.object({
      kind: z.literal("addLimit"),
      label: z.string().min(1).max(60),
      threshold: z.number().int().min(1).max(50),
    }),
    z.object({ kind: z.literal("removeLimit"), limitId: LimitId }),
    z.object({
      kind: z.literal("renameLimit"),
      limitId: LimitId,
      label: z.string().min(1).max(60),
    }),
    z.object({
      kind: z.literal("updateLimitThreshold"),
      limitId: LimitId,
      threshold: z.number().int().min(1).max(50),
    }),
    z.object({
      kind: z.literal("updateLimitCurrent"),
      limitId: LimitId,
      delta: z.union([z.literal(-1), z.literal(1)]),
    }),

    z.object({
      kind: z.literal("addThreat"),
      description: z.string().min(1).max(280),
      consequenceTemplate: ConsequenceTemplateSchema,
    }),
    z.object({ kind: z.literal("removeThreat"), threatId: ThreatId }),
    z.object({
      kind: z.literal("updateThreat"),
      threatId: ThreatId,
      description: z.string().min(1).max(280),
      consequenceTemplate: ConsequenceTemplateSchema,
    }),

    z.object({ kind: z.literal("setEngaged"), engaged: z.boolean() }),
    z.object({ kind: z.literal("refreshTags") }),
    z.object({
      kind: z.literal("setExposeStatuses"),
      exposeStatuses: z.boolean(),
    }),
    z.object({
      kind: z.literal("setExposeLimits"),
      exposeLimits: z.boolean(),
    }),
  ]),
});
export type MutateChallengeInput = z.infer<typeof MutateChallengeInput>;

export const DeliverThreatInput = z.object({
  challengeId: ChallengeId,
  campaignId: CampaignId,
  threatId: ThreatId,
  targetCharacterId: CharacterId,
  scratchTarget: z
    .object({
      location: TagLocationSchema,
      tagId: TagId,
    })
    .optional(),
  markTrackTarget: z
    .object({
      themeId: ThemeId,
    })
    .optional(),
});
export type DeliverThreatInput = z.infer<typeof DeliverThreatInput>;

export const AddSessionLogEntryInput = z.object({
  campaignId: CampaignId,
  text: z.string().min(1).max(2000),
  subjectCharacterId: CharacterId.nullable().default(null),
});
export type AddSessionLogEntryInput = z.infer<typeof AddSessionLogEntryInput>;

export const DeleteSessionLogEntryInput = z.object({
  campaignId: CampaignId,
  entryId: SessionLogEntryId,
});
export type DeleteSessionLogEntryInput = z.infer<
  typeof DeleteSessionLogEntryInput
>;

export const ToggleSessionLogPinInput = z.object({
  campaignId: CampaignId,
  entryId: SessionLogEntryId,
});
export type ToggleSessionLogPinInput = z.infer<typeof ToggleSessionLogPinInput>;

export const EndCampActivityInput = z.object({
  characterId: CharacterId,
  activity: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("rest") }),
    z.object({ kind: z.literal("reflect"), themeId: ThemeId }),
    z.object({
      kind: z.literal("campAction"),
      description: z.string().max(280).default(""),
    }),
  ]),
});
export type EndCampActivityInput = z.infer<typeof EndCampActivityInput>;

export const MutateRelationshipsInput = z.object({
  characterId: CharacterId,
  op: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("add"),
      companionName: z.string().min(1).max(60),
      companionCharId: CharacterId.nullable().default(null),
      relationshipTag: z.string().min(1).max(60),
      polarity: z.enum(["helpful", "hindering"]),
    }),
    z.object({
      kind: z.literal("update"),
      relationshipId: FellowshipRelationshipId,
      relationshipTag: z.string().min(1).max(60).optional(),
      polarity: z.enum(["helpful", "hindering"]).optional(),
    }),
    z.object({
      kind: z.literal("remove"),
      relationshipId: FellowshipRelationshipId,
    }),
  ]),
});
export type MutateRelationshipsInput = z.infer<typeof MutateRelationshipsInput>;

export const OfferReactionForThreatInput = z.object({
  challengeId: ChallengeId,
  campaignId: CampaignId,
  threatId: ThreatId,
  targetCharacterId: CharacterId,
  scratchTarget: z
    .object({
      location: TagLocationSchema,
      tagId: TagId,
    })
    .optional(),
});
export type OfferReactionForThreatInput = z.infer<
  typeof OfferReactionForThreatInput
>;

export const ResolvePendingThreatInput = z.object({
  pendingThreatId: PendingThreatId,
  campaignId: CampaignId,
  reduction: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("none") }),
    z.object({
      kind: z.literal("tierReduction"),
      powerSpent: z.number().int().min(1).max(6),
    }),
    z.object({
      kind: z.literal("tagPreservation"),
      preserve: z.boolean(),
    }),
  ]),
});
export type ResolvePendingThreatInput = z.infer<
  typeof ResolvePendingThreatInput
>;

export const CancelPendingThreatInput = z.object({
  pendingThreatId: PendingThreatId,
  campaignId: CampaignId,
});
export type CancelPendingThreatInput = z.infer<typeof CancelPendingThreatInput>;

export const StartSessionInput = z.object({
  campaignId: CampaignId,
  title: z.string().max(80).optional(),
});
export type StartSessionInput = z.infer<typeof StartSessionInput>;

export const EndSessionInput = z.object({
  campaignId: CampaignId,
  notes: z.string().max(2000).optional(),
});
export type EndSessionInput = z.infer<typeof EndSessionInput>;

export const FetchEndOfSessionSummaryInput = z.object({
  campaignId: CampaignId,
});
export type FetchEndOfSessionSummaryInput = z.infer<
  typeof FetchEndOfSessionSummaryInput
>;

export const PingPresenceInput = z.object({
  campaignId: CampaignId.nullable().default(null),
  characterId: CharacterId.nullable().default(null),
});
export type PingPresenceInput = z.infer<typeof PingPresenceInput>;
