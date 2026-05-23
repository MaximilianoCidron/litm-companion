// TODO(refactor): promote campaign subdomain to its own feature.
"use server";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { DeclineDirectedInvitationInput } from "../schemas";
import { firestoreToInvitation } from "../lib/serialize";

interface DeclineResult {
  invitationId: string;
  declined: true;
}

export const declineDirectedInvitation = withAction(
  DeclineDirectedInvitationInput,
  async (input, ctx): Promise<DeclineResult> => {
    const db = getAdminDb();
    const ref = db.collection("invitations").doc(input.invitationId);

    return db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new ActionError("NOT_FOUND", "Invitation not found.");
      }
      const invitation = firestoreToInvitation(snap);

      if (invitation.kind !== "directed") {
        throw new ActionError(
          "INVALID_STATE",
          "This invitation isn't directed.",
        );
      }
      if (invitation.directedAtUid !== ctx.uid) {
        throw new ActionError(
          "FORBIDDEN",
          "This invitation isn't addressed to you.",
        );
      }
      if (invitation.status !== "open") {
        throw new ActionError(
          "INVALID_STATE",
          "This invitation has already been resolved.",
        );
      }

      // Delete to keep the player's inbox tidy and signal the decision
      // unambiguously to the GM (the entry disappears from their list).
      tx.delete(ref);

      return { invitationId: input.invitationId, declined: true as const };
    });
  },
);
