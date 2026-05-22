// TODO(refactor): promote campaign subdomain to its own feature.
"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { TransferGmInput } from "../schemas";
import { requireCampaignGm } from "../lib/access";

interface TransferResult {
  transferred: true;
  newGmUid: string;
}

export const transferGm = withAction(
  TransferGmInput,
  async (input, ctx): Promise<TransferResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const { snap } = await requireCampaignGm(
        input.campaignId,
        ctx.uid,
        tx,
      );
      const data = snap.data() ?? {};
      const playerUids: string[] = Array.isArray(data.playerUids)
        ? data.playerUids
        : [];

      if (input.newGmUid === ctx.uid) {
        throw new ActionError(
          "INVALID_STATE",
          "You are already the GM.",
        );
      }
      if (!playerUids.includes(input.newGmUid)) {
        throw new ActionError(
          "INVALID_STATE",
          "The new GM must already be a member.",
        );
      }

      tx.update(snap.ref, {
        gmUid: input.newGmUid,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { transferred: true as const, newGmUid: input.newGmUid };
    });
  },
);
