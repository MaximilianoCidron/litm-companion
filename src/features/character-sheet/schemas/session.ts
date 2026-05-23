import { z } from "zod";
import { CampaignId, SessionId } from "./ids";

export const SessionSchema = z.object({
  id: SessionId,
  campaignId: CampaignId,
  sessionNumber: z.number().int().min(1),
  startedByUid: z.string().min(1),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable().default(null),
  endedByUid: z.string().nullable().default(null),
  title: z.string().max(80).default(""),
  notes: z.string().max(2000).default(""),
});
export type Session = z.infer<typeof SessionSchema>;
