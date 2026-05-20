import { z } from "zod";

export const ProgressionSchema = z.object({
  promise: z.number().int().min(0).max(5),
  quintessences: z.array(z.string().min(1).max(120)).max(10),
});

export type Progression = z.infer<typeof ProgressionSchema>;
