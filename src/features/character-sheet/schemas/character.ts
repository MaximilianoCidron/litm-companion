import { z } from "zod";
import { CampaignId, CharacterId } from "./ids";
import { IdentitySchema } from "./identity";
import { ThemeSchema } from "./theme";
import { StatusSchema } from "./status";
import { BackpackSchema } from "./backpack";
import { ProgressionSchema } from "./progression";
import { FellowshipRelationshipSchema } from "./fellowship";
import { QuintessenceSchema } from "./quintessence";
import { MomentOfFulfillmentEntrySchema } from "./moment-of-fulfillment";

export const CharacterStatusSchema = z.enum(["active", "retired"]);
export type CharacterStatus = z.infer<typeof CharacterStatusSchema>;

export const CharacterAvatarSchema = z.object({
  mainUrl: z.string().url(),
  thumbUrl: z.string().url(),
  updatedAt: z.string().datetime(),
});
export type CharacterAvatar = z.infer<typeof CharacterAvatarSchema>;

export const CharacterSchema = z.object({
  id: CharacterId,
  userId: z.string().min(1),
  campaignIds: z.array(CampaignId).max(20),
  identity: IdentitySchema,
  themes: z.tuple([ThemeSchema, ThemeSchema, ThemeSchema, ThemeSchema]),
  statuses: z.array(StatusSchema).max(20),
  backpack: BackpackSchema,
  progression: ProgressionSchema,
  fellowship: z.object({
    relationships: z.array(FellowshipRelationshipSchema).max(10),
  }),
  // Legacy docs lack this field — Zod default keeps them parseable.
  status: CharacterStatusSchema.default("active"),
  // Structured avatar (main 512 + thumb 128). Legacy docs default to null.
  avatar: CharacterAvatarSchema.nullable().default(null),
  // Quintessences are first-class invokable +1 tags acquired exclusively
  // through the `gainQuintessence` Moment of Fulfillment path. Legacy docs
  // stored these as `progression.quintessences: string[]` — see
  // `firestoreToCharacter` for the on-read migration to structured objects.
  quintessences: z.array(QuintessenceSchema).max(20).default([]),
  // Discriminated MoF history. Legacy docs stored a flat shape under
  // `progression.momentsOfFulfillment`; `firestoreToCharacter` migrates
  // those to the new union on read.
  momentsOfFulfillment: z
    .array(MomentOfFulfillmentEntrySchema)
    .max(20)
    .default([]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Character = z.infer<typeof CharacterSchema>;

export const CharacterSummarySchema = z.object({
  id: CharacterId,
  name: z.string(),
  concept: z.string(),
  avatarUrl: z.string().url().nullable(),
  campaignName: z.string().nullable(),
  promise: z.number().int().min(0).max(5),
  status: CharacterStatusSchema.default("active"),
});

export type CharacterSummary = z.infer<typeof CharacterSummarySchema>;
