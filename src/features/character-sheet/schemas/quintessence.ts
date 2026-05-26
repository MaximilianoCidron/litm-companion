import { z } from "zod";
import { MomentOfFulfillmentEntryId, QuintessenceId } from "./ids";

/**
 * Quintessence — a permanent +1 tag acquired exclusively through the
 * `gainQuintessence` Moment of Fulfillment path. Scratches on invocation,
 * refreshes on camp rest, and can never be burned or preserved.
 */
export const QuintessenceSchema = z.object({
  id: QuintessenceId,
  name: z.string().min(1).max(120),
  scratched: z.boolean().default(false),
  /** Links back to the MoF entry that created this quintessence. */
  sourceMoFEntryId: MomentOfFulfillmentEntryId,
  createdAt: z.string().datetime(),
});
export type Quintessence = z.infer<typeof QuintessenceSchema>;
