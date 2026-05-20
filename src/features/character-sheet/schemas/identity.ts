import { z } from "zod";

export const IdentitySchema = z.object({
  name: z.string().min(1).max(60),
  concept: z.string().max(120).default(""),
  playerName: z.string().max(60).default(""),
  pronouns: z.string().max(30).default(""),
  avatarUrl: z.string().url().nullable().default(null),
  legendMistBalance: z.number().int().min(-5).max(5).default(0),
});

export type Identity = z.infer<typeof IdentitySchema>;
