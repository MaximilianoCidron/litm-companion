import { z } from "zod";
import { FellowshipRelationshipId } from "./ids";

export const FellowshipRelationshipSchema = z.object({
  id: FellowshipRelationshipId,
  partnerName: z.string().min(1).max(60),
  relationshipTag: z.string().max(120).default(""),
});

export type FellowshipRelationship = z.infer<typeof FellowshipRelationshipSchema>;
