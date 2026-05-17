import { z } from "zod";

/**
 * Minimal schemas for the UI scaffold. Full schemas (tracks, statuses,
 * relationships, statuses w/ tier) land with the Firestore data layer.
 */

export const characterSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  concept: z.string().min(1),
  avatarUrl: z.string().url().nullable(),
  campaignName: z.string().min(1),
  promise: z.number().int().min(0).max(5),
});

export type CharacterSummary = z.infer<typeof characterSummarySchema>;

export const themePlaceholderSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  type: z.string(),
  origin: z.string(),
  quest: z.string(),
  powerTags: z.array(z.string()).max(5),
  weaknessTags: z.array(z.string()).max(3),
  abandon: z.number().int().min(0).max(3),
  improve: z.number().int().min(0).max(3),
  milestone: z.number().int().min(0).max(3),
});

export type ThemePlaceholder = z.infer<typeof themePlaceholderSchema>;

export const characterSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  concept: z.string().min(1),
  avatarUrl: z.string().url().nullable(),
  campaignName: z.string().min(1),
  promise: z.number().int().min(0).max(5),
  playerName: z.string().nullable(),
  themes: z.tuple([
    themePlaceholderSchema,
    themePlaceholderSchema,
    themePlaceholderSchema,
    themePlaceholderSchema,
  ]),
});

export type Character = z.infer<typeof characterSchema>;
