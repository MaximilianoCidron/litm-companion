// TODO(refactor): promote campaign subdomain to its own feature.
import { z } from "zod";
import { CampaignId, InvitationId } from "./ids";

export const InvitationStatusSchema = z.enum(["open", "consumed", "revoked"]);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

export const InvitationSchema = z.object({
  id: InvitationId,
  campaignId: CampaignId,
  // Denormalized for display on /invite/[token] without an extra fetch.
  campaignName: z.string().min(1),
  invitedByUid: z.string().min(1),
  status: InvitationStatusSchema,
  consumedByUid: z.string().nullable(),
  consumedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export type Invitation = z.infer<typeof InvitationSchema>;
