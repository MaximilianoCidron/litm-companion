"use server";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { DeleteSessionLogEntryInput } from "../schemas";

export const deleteSessionLogEntry = withAction(
  DeleteSessionLogEntryInput,
  async (input, ctx): Promise<{ entryId: string; deleted: true }> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      const entryRef = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("sessionLog")
        .doc(input.entryId);
      const entrySnap = await tx.get(entryRef);
      if (!entrySnap.exists) {
        throw new ActionError("NOT_FOUND", "Log entry not found.");
      }
      const entryData = entrySnap.data() ?? {};

      const campRef = db.collection("campaigns").doc(input.campaignId);
      const campSnap = await tx.get(campRef);
      if (!campSnap.exists) {
        throw new ActionError("NOT_FOUND", "Campaign not found.");
      }
      const campData = campSnap.data() ?? {};

      const isAuthor = entryData.authorUid === ctx.uid;
      const isGm = campData.gmUid === ctx.uid;
      if (!isAuthor && !isGm) {
        throw new ActionError(
          "FORBIDDEN",
          "Only the author or the GM can delete this entry.",
        );
      }

      tx.delete(entryRef);
      return { entryId: input.entryId, deleted: true as const };
    });
  },
);
