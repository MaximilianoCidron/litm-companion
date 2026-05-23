"use server";
import { getAdminDb } from "@/shared/firebase/admin";
import { withAction } from "@/shared/auth";
import { DeleteChallengeInput } from "../schemas";
import { requireCampaignGm } from "../lib/access";

interface DeleteChallengeResult {
  challengeId: string;
  deleted: true;
}

export const deleteChallenge = withAction(
  DeleteChallengeInput,
  async (input, ctx): Promise<DeleteChallengeResult> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      await requireCampaignGm(input.campaignId, ctx.uid, tx);
      const challengeRef = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("challenges")
        .doc(input.challengeId);
      const mirrorRef = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("engagedChallenges")
        .doc(input.challengeId);
      tx.delete(challengeRef);
      // Mirror delete is unconditional — Firestore tx.delete on a missing
      // doc is a no-op, so we don't need to read engaged state first.
      tx.delete(mirrorRef);
      return { challengeId: input.challengeId, deleted: true as const };
    });
  },
);
