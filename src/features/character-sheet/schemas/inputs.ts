import { z } from "zod";
import { CampaignId, CharacterId, StatusId, TagId, ThemeId } from "./ids";
import { ThemeTypeSchema } from "./theme";
import { MightModifierSchema, TagLocationSchema } from "./roll";

export const CreateCharacterInput = z.object({
  name: z.string().min(1).max(60),
  concept: z.string().max(120).default(""),
  campaignId: CampaignId.optional(),
});
export type CreateCharacterInput = z.infer<typeof CreateCharacterInput>;

export const UpdateTagInput = z.object({
  characterId: CharacterId,
  location: z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("theme"), themeId: ThemeId, tagId: TagId }),
    z.object({ kind: z.literal("backpack"), tagId: TagId }),
  ]),
  patch: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("rename"),
      name: z.string().min(1).max(60),
    }),
    z.object({
      kind: z.literal("scratch"),
      scratched: z.boolean(),
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
});
export type CommitRollInput = z.infer<typeof CommitRollInput>;
