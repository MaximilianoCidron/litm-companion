// TODO(refactor): promote campaign subdomain to its own feature.
"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  CreateDirectedInvitationInput,
  InvitationId,
} from "../schemas";
import { requireCampaignGm } from "../lib/access";
import { getAuthorDisplayName } from "../lib/session-log";

const INVITATION_EXPIRY_DAYS = 7;

interface CreateDirectedResult {
  invitationId: string;
  directedAtEmail: string;
  expiresAt: string;
}

export const createDirectedInvitation = withAction(
  CreateDirectedInvitationInput,
  async (input, ctx): Promise<CreateDirectedResult> => {
    const db = getAdminDb();

    // Resolve target user by email via Admin Auth. Outside the transaction
    // because Firestore transactions can't include Admin Auth calls. The
    // downside: if the account is deleted between this lookup and the
    // commit we'd create an orphaned invitation — acceptable v1 risk.
    let targetUser;
    try {
      targetUser = await getAdminAuth().getUserByEmail(input.targetEmail);
    } catch (err: unknown) {
      if (
        err !== null &&
        typeof err === "object" &&
        "code" in err &&
        (err as { code: string }).code === "auth/user-not-found"
      ) {
        throw new ActionError(
          "NOT_FOUND",
          "No user is registered with that email. Ask them to sign up first.",
        );
      }
      throw err;
    }

    const targetUid = targetUser.uid;
    const targetDisplayName = targetUser.displayName ?? null;

    if (targetUid === ctx.uid) {
      throw new ActionError("INVALID_STATE", "You can't invite yourself.");
    }

    const invitedByName = getAuthorDisplayName(ctx);
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    ).toISOString();

    return db.runTransaction(async (tx) => {
      // GM check + campaign load
      const { snap: campSnap } = await requireCampaignGm(
        input.campaignId,
        ctx.uid,
        tx,
      );
      const campData = campSnap.data() ?? {};
      const campaignName = (campData.name as string | undefined) ?? "";
      const playerUids: string[] = Array.isArray(campData.playerUids)
        ? campData.playerUids
        : [];

      if (playerUids.includes(targetUid)) {
        throw new ActionError(
          "INVALID_STATE",
          "That user is already in this campaign.",
        );
      }

      // Reject duplicate pending invitations. Composite index
      // (campaignId, directedAtUid, status) covers this query.
      const dupQuery = db
        .collection("invitations")
        .where("campaignId", "==", input.campaignId)
        .where("directedAtUid", "==", targetUid)
        .where("status", "==", "open");
      const dupSnap = await tx.get(dupQuery);
      if (!dupSnap.empty) {
        throw new ActionError(
          "INVALID_STATE",
          "An invitation is already pending for this user.",
        );
      }

      const invitationRef = db.collection("invitations").doc();
      const invitationId = InvitationId.parse(invitationRef.id);

      tx.set(invitationRef, {
        id: invitationId,
        kind: "directed",
        campaignId: input.campaignId,
        campaignName,
        invitedByUid: ctx.uid,
        invitedByName,
        directedAtUid: targetUid,
        directedAtEmail: input.targetEmail,
        directedAtName: targetDisplayName,
        status: "open",
        consumedByUid: null,
        consumedAt: null,
        createdAt: FieldValue.serverTimestamp(),
        expiresAt,
      });

      return {
        invitationId,
        directedAtEmail: input.targetEmail,
        expiresAt,
      };
    });
  },
);
