import { z } from "zod";
import { CampaignId, CharacterId } from "./ids";

export const PresenceDocSchema = z.object({
  uid: z.string().min(1),
  displayName: z.string().min(1).max(100),
  lastSeenAt: z.string().datetime(),
  currentCampaignId: CampaignId.nullable().default(null),
  currentCharacterId: CharacterId.nullable().default(null),
});
export type PresenceDoc = z.infer<typeof PresenceDocSchema>;
