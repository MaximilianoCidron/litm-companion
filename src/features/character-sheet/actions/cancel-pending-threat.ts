"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { CancelPendingThreatInput } from "../schemas";
import { requireCampaignGm } from "../lib/access";

export const cancelPendingThreat = withAction(
  CancelPendingThreatInput,
  async (input, ctx): Promise<{ pendingThreatId: string; canceled: true }> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      await requireCampaignGm(input.campaignId, ctx.uid, tx);
      const ref = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("pendingThreats")
        .doc(input.pendingThreatId);
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new ActionError("NOT_FOUND", "Pending threat not found.");
      }
      const status = (snap.data()?.status as string | undefined) ?? "";
      if (status !== "awaitingReaction" && status !== "reactionRolled") {
        throw new ActionError(
          "INVALID_STATE",
          "This pending threat is no longer active.",
        );
      }
      tx.update(ref, {
        status: "canceled",
        resolution: { kind: "canceled" },
        resolvedAt: FieldValue.serverTimestamp(),
      });
      return { pendingThreatId: input.pendingThreatId, canceled: true as const };
    });
  },
);
