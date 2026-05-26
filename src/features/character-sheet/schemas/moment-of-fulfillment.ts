import { z } from "zod";
import { MomentOfFulfillmentEntryId, TagId, ThemeId } from "./ids";

export const MomentOfFulfillmentPathSchema = z.enum([
  "retire",
  "reforge",
  "gainQuintessence",
  "shakeWorld",
  "speakWordsEternal",
  "unearthTruths",
]);
export type MomentOfFulfillmentPath = z.infer<
  typeof MomentOfFulfillmentPathSchema
>;

/**
 * Discriminated snapshot of what happened in a specific Moment of
 * Fulfillment. Stored on the character so the Legend (history) can render
 * each path with its specific narrative detail. The `id` ties quintessences
 * back to the entry that created them.
 */
export const MomentOfFulfillmentEntrySchema = z.discriminatedUnion("path", [
  z.object({
    id: MomentOfFulfillmentEntryId,
    path: z.literal("retire"),
    resolvedAt: z.string().datetime(),
    finalWords: z.string().max(2000).default(""),
  }),
  z.object({
    id: MomentOfFulfillmentEntryId,
    path: z.literal("reforge"),
    resolvedAt: z.string().datetime(),
    replacedThemeName: z.string(),
    newThemeId: ThemeId,
    newThemeName: z.string(),
    narrativeDescription: z.string().max(2000).default(""),
  }),
  z.object({
    id: MomentOfFulfillmentEntryId,
    path: z.literal("gainQuintessence"),
    resolvedAt: z.string().datetime(),
    quintessenceName: z.string(),
    narrativeDescription: z.string().max(2000).default(""),
  }),
  z.object({
    id: MomentOfFulfillmentEntryId,
    path: z.literal("shakeWorld"),
    resolvedAt: z.string().datetime(),
    narrativeDescription: z.string().min(1).max(2000),
  }),
  z.object({
    id: MomentOfFulfillmentEntryId,
    path: z.literal("speakWordsEternal"),
    resolvedAt: z.string().datetime(),
    themeId: ThemeId,
    themeName: z.string(),
    newPowerTagName: z.string(),
    newPowerTagId: TagId,
    narrativeDescription: z.string().max(2000).default(""),
  }),
  z.object({
    id: MomentOfFulfillmentEntryId,
    path: z.literal("unearthTruths"),
    resolvedAt: z.string().datetime(),
    narrativeDescription: z.string().min(1).max(2000),
  }),
]);
export type MomentOfFulfillmentEntry = z.infer<
  typeof MomentOfFulfillmentEntrySchema
>;
