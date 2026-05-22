// TODO(refactor): promote campaign subdomain to its own feature.
"use server";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { RevokeInvitationInput } from "../schemas";
import { requireCampaignGm } from "../lib/access";

interface RevokeResult {
  invitationId: string;
  revoked: true;
}

export const revokeInvitation = withAction(
  RevokeInvitationInput,
  async (input, ctx): Promise<RevokeResult> => {
    const db = getAdminDb();
    const invitationRef = db
      .collection("invitations")
      .doc(input.invitationId);

    return db.runTransaction(async (tx) => {
      const inviteSnap = await tx.get(invitationRef);
      if (!inviteSnap.exists) {
        throw new ActionError("NOT_FOUND", "Invitation not found.");
      }
      const inviteData = inviteSnap.data() ?? {};
      const campaignId = inviteData.campaignId as string | undefined;
      if (!campaignId) {
        throw new ActionError("INVALID_STATE", "Invitation has no campaign.");
      }

      // GM-only — read campaign inside the transaction so the access check
      // is part of the same atomic op.
      await requireCampaignGm(campaignId, ctx.uid, tx);

      // Idempotent: revoking an already-revoked invite returns ok. We still
      // re-write the status field — it's a no-op for already-revoked docs
      // and saves a branch.
      tx.update(invitationRef, { status: "revoked" });

      return { invitationId: input.invitationId, revoked: true as const };
    });
  },
);
