"use server";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { ToggleSessionLogPinInput } from "../schemas";
import { requireCampaignGm } from "../lib/access";

export const toggleSessionLogPin = withAction(
  ToggleSessionLogPinInput,
  async (input, ctx): Promise<{ entryId: string; pinned: boolean }> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      await requireCampaignGm(input.campaignId, ctx.uid, tx);
      const ref = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("sessionLog")
        .doc(input.entryId);
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new ActionError("NOT_FOUND", "Log entry not found.");
      }
      const current = Boolean(snap.data()?.pinned);
      const next = !current;
      tx.update(ref, { pinned: next });
      return { entryId: input.entryId, pinned: next };
    });
  },
);
