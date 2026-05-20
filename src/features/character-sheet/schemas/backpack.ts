import { z } from "zod";
import { StoryTagSchema } from "./tag";

export const BackpackSchema = z.object({
  storyTags: z.array(StoryTagSchema).max(40),
  notes: z.string().max(2000).default(""),
});

export type Backpack = z.infer<typeof BackpackSchema>;
