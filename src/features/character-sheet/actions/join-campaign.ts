"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { JoinCampaignInput } from "../schemas";
import { requireCharacterAccess } from "../lib/access";

const ROSTER_LIMIT = 8;

interface JoinResult {
  joined: boolean;
  alreadyMember: boolean;
}

export const joinCampaign = withAction(
  JoinCampaignInput,
  async (input, ctx): Promise<JoinResult> => {
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
          "Only the character's owner can join a campaign.",
        );
      }
      const charData = access.snap.data() ?? {};
      const identity = (charData.identity as Record<string, unknown>) ?? {};
      const charCampaignIds = Array.isArray(charData.campaignIds)
        ? (charData.campaignIds as string[])
        : [];

      const campaignRef = db.collection("campaigns").doc(input.campaignId);
      const campaignSnap = await tx.get(campaignRef);
      if (!campaignSnap.exists) {
        throw new ActionError("NOT_FOUND", "Campaign not found.");
      }
      const campData = campaignSnap.data() ?? {};
      const characterIds = Array.isArray(campData.characterIds)
        ? (campData.characterIds as string[])
        : [];
      const roster = Array.isArray(campData.roster)
        ? (campData.roster as Record<string, unknown>[])
        : [];

      if (
        characterIds.includes(input.characterId) ||
        charCampaignIds.includes(input.campaignId)
      ) {
        return { joined: false, alreadyMember: true };
      }

      if (roster.length >= ROSTER_LIMIT) {
        throw new ActionError("INVALID_STATE", "Campaign roster is full.");
      }

      const rosterEntry = {
        characterId: input.characterId,
        characterName:
          (identity.name as string | undefined) || "Unnamed hero",
        playerUid: (charData.userId as string | undefined) ?? ctx.uid,
        avatarUrl:
          (identity.avatarUrl as string | null | undefined) ?? null,
        joinedAt: new Date().toISOString(),
      };

      tx.update(access.snap.ref, {
        campaignIds: FieldValue.arrayUnion(input.campaignId),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.update(campaignRef, {
        characterIds: FieldValue.arrayUnion(input.characterId),
        roster: FieldValue.arrayUnion(rosterEntry),
        playerUids: FieldValue.arrayUnion(rosterEntry.playerUid),
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { joined: true, alreadyMember: false };
    });
  },
);
