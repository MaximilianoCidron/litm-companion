import { z } from "zod";
import { StatusId } from "./ids";
import { TagPolaritySchema } from "./tag";

export const StatusSchema = z.object({
  id: StatusId,
  name: z.string().min(1).max(40),
  tier: z.number().int().min(1).max(6),
  polarity: TagPolaritySchema,
});

export type Status = z.infer<typeof StatusSchema>;
