import { z } from "zod";

export const CharacterId = z.string().min(1).brand<"CharacterId">();
export const ThemeId = z.string().min(1).brand<"ThemeId">();
export const TagId = z.string().min(1).brand<"TagId">();
export const StatusId = z.string().min(1).brand<"StatusId">();
export const CampaignId = z.string().min(1).brand<"CampaignId">();
export const FellowshipRelationshipId = z
  .string()
  .min(1)
  .brand<"FellowshipRelationshipId">();
export const RollId = z.string().min(1).brand<"RollId">();

export type CharacterId = z.infer<typeof CharacterId>;
export type ThemeId = z.infer<typeof ThemeId>;
export type TagId = z.infer<typeof TagId>;
export type StatusId = z.infer<typeof StatusId>;
export type CampaignId = z.infer<typeof CampaignId>;
export type FellowshipRelationshipId = z.infer<typeof FellowshipRelationshipId>;
export type RollId = z.infer<typeof RollId>;
