"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { LeaveCampaignInput } from "../schemas";
import { requireCharacterAccess } from "../lib/access";

interface LeaveResult {
  left: boolean;
}

export const leaveCampaign = withAction(
  LeaveCampaignInput,
  async (input, ctx): Promise<LeaveResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );
      if (access.role !== "owner") {
        throw new ActionError(
          "FORBIDDEN",
          "Only the character's owner can leave a campaign.",
        );
      }
      const charData = access.snap.data() ?? {};

      const campaignRef = db.collection("campaigns").doc(input.campaignId);
      const campaignSnap = await tx.get(campaignRef);
      if (!campaignSnap.exists) {
        throw new ActionError("NOT_FOUND", "Campaign not found.");
      }
      const campData = campaignSnap.data() ?? {};

      const gmUid = (campData.gmUid as string | undefined) ?? "";
      const playerUid = (charData.userId as string | undefined) ?? ctx.uid;
      if (gmUid === playerUid) {
        throw new ActionError(
          "INVALID_STATE",
          "Transfer the GM role before leaving.",
        );
      }

      const roster = Array.isArray(campData.roster)
        ? (campData.roster as Record<string, unknown>[])
        : [];
      const nextRoster = roster.filter(
        (r) => (r.characterId as string | undefined) !== input.characterId,
      );

      // If this player has other characters in this campaign, keep the uid in
      // playerUids. Otherwise remove it so security rules drop their read access.
      const remainingPlayerUids = new Set<string>(
        nextRoster
          .map((r) => r.playerUid)
          .filter((p): p is string => typeof p === "string"),
      );
      const stillMember = remainingPlayerUids.has(playerUid);

      tx.update(access.snap.ref, {
        campaignIds: FieldValue.arrayRemove(input.campaignId),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const update: Record<string, unknown> = {
        characterIds: FieldValue.arrayRemove(input.characterId),
        roster: nextRoster,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (!stillMember) {
        update.playerUids = FieldValue.arrayRemove(playerUid);
      }
      tx.update(campaignRef, update);

      return { left: true };
    });
  },
);
