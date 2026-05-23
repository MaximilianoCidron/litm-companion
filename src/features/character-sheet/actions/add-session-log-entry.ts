"use server";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { AddSessionLogEntryInput } from "../schemas";
import { requireCampaignMembership } from "../lib/access";
import {
  activeSessionIdFrom,
  getAuthorDisplayName,
  writeLogEntry,
} from "../lib/session-log";

export const addSessionLogEntry = withAction(
  AddSessionLogEntryInput,
  async (input, ctx): Promise<{ entryId: string }> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      const { snap: campSnap } = await requireCampaignMembership(
        input.campaignId,
        ctx.uid,
        tx,
      );
      const sessionId = activeSessionIdFrom(campSnap.data() ?? undefined);

      let subjectCharacterName: string | null = null;
      if (input.subjectCharacterId) {
        const charRef = db
          .collection("characters")
          .doc(input.subjectCharacterId);
        const charSnap = await tx.get(charRef);
        if (!charSnap.exists) {
          throw new ActionError("NOT_FOUND", "Linked hero not found.");
        }
        const charData = charSnap.data() ?? {};
        const campaignIds = Array.isArray(charData.campaignIds)
          ? (charData.campaignIds as string[])
          : [];
        if (!campaignIds.includes(input.campaignId)) {
          throw new ActionError(
            "INVALID_STATE",
            "Linked character isn't in this campaign.",
          );
        }
        subjectCharacterName =
          (charData.identity?.name as string | undefined) ?? null;
      }

      const { entryId } = writeLogEntry(tx, {
        campaignId: input.campaignId,
        authorUid: ctx.uid,
        authorName: getAuthorDisplayName(ctx),
        subjectCharacterId: input.subjectCharacterId,
        subjectCharacterName,
        text: input.text,
        details: { kind: "annotation" },
        sessionId,
      });

      return { entryId };
    });
  },
);
