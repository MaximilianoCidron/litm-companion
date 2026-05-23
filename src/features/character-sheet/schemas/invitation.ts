// TODO(refactor): promote campaign subdomain to its own feature.
import { z } from "zod";
import { CampaignId, InvitationId } from "./ids";

export const InvitationStatusSchema = z.enum(["open", "consumed", "revoked"]);
export type InvitationStatus = z.infer<typeof InvitationStatusSchema>;

// Shared base across both invitation variants. Legacy docs without
// `invitedByName` parse with the empty-string default — backfilled at next
// write.
const InvitationBaseSchema = z.object({
  id: InvitationId,
  campaignId: CampaignId,
  campaignName: z.string().min(1),
  invitedByUid: z.string().min(1),
  invitedByName: z.string().max(100).default(""),
  status: InvitationStatusSchema,
  consumedByUid: z.string().nullable(),
  consumedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime(),
});

export const InvitationSchema = z.discriminatedUnion("kind", [
  InvitationBaseSchema.extend({
    // Link-based invitation. The doc id IS the token — no separate field.
    kind: z.literal("token"),
  }),
  InvitationBaseSchema.extend({
    // Directed invitation addressed to a specific user by uid (resolved from
    // email at creation time).
    kind: z.literal("directed"),
    directedAtUid: z.string().min(1),
    directedAtEmail: z.string().email(),
    directedAtName: z.string().max(100).nullable().default(null),
  }),
]);

export type Invitation = z.infer<typeof InvitationSchema>;
