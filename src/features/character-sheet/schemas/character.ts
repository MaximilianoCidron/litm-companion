import { z } from "zod";
import { CampaignId, CharacterId } from "./ids";
import { IdentitySchema } from "./identity";
import { ThemeSchema } from "./theme";
import { StatusSchema } from "./status";
import { BackpackSchema } from "./backpack";
import { ProgressionSchema } from "./progression";
import { FellowshipRelationshipSchema } from "./fellowship";

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
});

export type CharacterSummary = z.infer<typeof CharacterSummarySchema>;
