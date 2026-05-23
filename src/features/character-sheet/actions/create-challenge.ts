"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { withAction } from "@/shared/auth";
import { ChallengeId, CreateChallengeInput } from "../schemas";
import { requireCampaignGm } from "../lib/access";
import { buildBlankChallenge } from "../lib/campaign-factory";

interface CreateChallengeResult {
  challengeId: string;
}

export const createChallenge = withAction(
  CreateChallengeInput,
  async (input, ctx): Promise<CreateChallengeResult> => {
    const db = getAdminDb();
    await requireCampaignGm(input.campaignId, ctx.uid);

    const campRef = db.collection("campaigns").doc(input.campaignId);
    const challengeRef = campRef.collection("challenges").doc();
    const challengeId = ChallengeId.parse(challengeRef.id);

    const blank = buildBlankChallenge({
      id: challengeId,
      campaignId: input.campaignId,
      name: input.name,
      role: input.role,
      mightLevel: input.mightLevel,
    });

    await challengeRef.set({
      ...blank,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { challengeId };
  },
);
