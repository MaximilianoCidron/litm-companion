import { z } from "zod";
import { TagId } from "./ids";

export const TagPolaritySchema = z.enum(["helpful", "hindering"]);
export type TagPolarity = z.infer<typeof TagPolaritySchema>;

export const PowerTagSchema = z
  .object({
    id: TagId,
    name: z.string().min(1).max(60),
    scratched: z.boolean(),
    burned: z.boolean(),
  })
  .refine((t) => !t.burned || t.scratched, {
    message: "A burned tag must also be scratched.",
    path: ["scratched"],
  });

export type PowerTag = z.infer<typeof PowerTagSchema>;

export const WeaknessTagSchema = z.object({
  id: TagId,
  name: z.string().min(1).max(60),
});

export type WeaknessTag = z.infer<typeof WeaknessTagSchema>;

export const StoryTagSchema = z.object({
  id: TagId,
  name: z.string().min(1).max(60),
  polarity: TagPolaritySchema,
  isSingleUse: z.boolean(),
  scratched: z.boolean(),
});

export type StoryTag = z.infer<typeof StoryTagSchema>;
