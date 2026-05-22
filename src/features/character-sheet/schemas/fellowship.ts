import { z } from "zod";
import { CharacterId, FellowshipRelationshipId } from "./ids";

export const FellowshipRelationshipSchema = z.object({
  id: FellowshipRelationshipId,
  companionCharId: CharacterId.nullable(),
  companionName: z.string().min(1).max(60),
  relationshipTag: z.string().min(1).max(60),
  polarity: z.enum(["helpful", "hindering"]).default("helpful"),
});

export type FellowshipRelationship = z.infer<typeof FellowshipRelationshipSchema>;
