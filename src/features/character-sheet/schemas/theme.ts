import { z } from "zod";
import { ThemeId } from "./ids";
import { PowerTagSchema, WeaknessTagSchema } from "./tag";

export const MightLevelSchema = z.enum(["origin", "adventure", "greatness"]);
export type MightLevel = z.infer<typeof MightLevelSchema>;

export const ThemeTypeSchema = z.enum([
  // origin (7)
  "origin:circumstance",
  "origin:devotion",
  "origin:past",
  "origin:people",
  "origin:personality",
  "origin:skill_trade",
  "origin:trait",
  // adventure (6)
  "adventure:duty",
  "adventure:influence",
  "adventure:knowledge",
  "adventure:prodigious_ability",
  "adventure:relic",
  "adventure:uncanny_being",
  // greatness (4)
  "greatness:destiny",
  "greatness:dominion",
  "greatness:mastery",
  "greatness:monstrosity",
]);
export type ThemeType = z.infer<typeof ThemeTypeSchema>;

export function inferMightLevel(type: ThemeType): MightLevel {
  const prefix = type.split(":", 1)[0];
  if (prefix === "origin" || prefix === "adventure" || prefix === "greatness") {
    return prefix;
  }
  throw new Error(`Unknown theme type prefix: ${type}`);
}

export const ThemeTracksSchema = z.object({
  improve: z.number().int().min(0).max(3),
  milestone: z.number().int().min(0).max(3),
  abandon: z.number().int().min(0).max(3),
});
export type ThemeTracks = z.infer<typeof ThemeTracksSchema>;

export const ThemeSchema = z
  .object({
    id: ThemeId,
    type: ThemeTypeSchema,
    mightLevel: MightLevelSchema,
    name: z.string().min(1).max(60),
    quest: z.string().max(200).default(""),
    powerTags: z.array(PowerTagSchema).max(12),
    weaknessTag: WeaknessTagSchema,
    specialImprovements: z.array(z.string().min(1).max(120)).max(12),
    tracks: ThemeTracksSchema,
  })
  .refine((t) => inferMightLevel(t.type) === t.mightLevel, {
    message: "mightLevel does not match the prefix of type.",
    path: ["mightLevel"],
  });

export type Theme = z.infer<typeof ThemeSchema>;
