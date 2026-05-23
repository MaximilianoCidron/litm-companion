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
    await requireCampaignGm(input.campaignId, ctx.uid);
    const ref = db
      .collection("campaigns")
      .doc(input.campaignId)
      .collection("challenges")
      .doc(input.challengeId);
    await ref.delete();
    return { challengeId: input.challengeId, deleted: true };
  },
);
