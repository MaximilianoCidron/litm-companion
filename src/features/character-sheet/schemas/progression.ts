import { z } from "zod";

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

export const MomentOfFulfillmentEntrySchema = z.object({
  id: z.string().min(1),
  chosenPath: MomentOfFulfillmentPathSchema,
  description: z.string().max(500).default(""),
  burnedTagsRestored: z.number().int().min(0).default(0),
  completedAt: z.string().datetime(),
});
export type MomentOfFulfillmentEntry = z.infer<
  typeof MomentOfFulfillmentEntrySchema
>;

export const ProgressionSchema = z.object({
  promise: z.number().int().min(0).max(5),
  // Per-string max kept at 120 to tolerate legacy docs.
  quintessences: z.array(z.string().min(1).max(120)).max(20),
  // History of resolved Moments of Fulfillment. Default keeps legacy docs
  // (lacking the field) parseable through `firestoreToCharacter`.
  momentsOfFulfillment: z
    .array(MomentOfFulfillmentEntrySchema)
    .max(20)
    .default([]),
});

export type Progression = z.infer<typeof ProgressionSchema>;
