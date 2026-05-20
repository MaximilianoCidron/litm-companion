import { z } from "zod";
import { CampaignId, CharacterId, StatusId, TagId, ThemeId } from "./ids";
import { ThemeTypeSchema } from "./theme";

export const CreateCharacterInput = z.object({
  name: z.string().min(1).max(60),
  concept: z.string().max(120).default(""),
  campaignId: CampaignId.optional(),
});
export type CreateCharacterInput = z.infer<typeof CreateCharacterInput>;

export const UpdateTagInput = z.object({
  characterId: CharacterId,
  themeId: ThemeId,
  tagId: TagId,
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
      kind: z.literal("update"),
      statusId: StatusId,
      tier: z.number().int().min(1).max(6),
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
