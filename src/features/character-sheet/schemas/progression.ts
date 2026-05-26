import { z } from "zod";

// Note: `MomentOfFulfillmentPathSchema` + `MomentOfFulfillmentEntrySchema`
// have moved to `./moment-of-fulfillment.ts`. They were re-shaped from a
// flat history record into a discriminated union per path so the Legend
// surface can render path-specific narrative detail. `quintessences` and
// `momentsOfFulfillment` are now top-level fields on `CharacterSchema`
// (not nested in progression) — see `firestoreToCharacter` for the
// legacy-doc migration that pulls them out of the old `progression.*`
// shape on read.

export const ProgressionSchema = z.object({
  promise: z.number().int().min(0).max(5),
});

export type Progression = z.infer<typeof ProgressionSchema>;
