// TODO(refactor): promote campaign subdomain to its own feature.
"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { RedeemInvitationInput } from "../schemas";

const ROSTER_LIMIT = 8;

interface RedeemResult {
  joinedCampaignId: string;
  characterId: string;
}

interface RosterDoc {
  characterId?: string;
  characterName?: string;
  playerUid?: string;
  avatarUrl?: string | null;
  joinedAt?: string;
}

export const redeemInvitation = withAction(
  RedeemInvitationInput,
  async (input, ctx): Promise<RedeemResult> => {
    const db = getAdminDb();
    const invitationRef = db
      .collection("invitations")
      .doc(input.invitationId);
    const characterRef = db.collection("characters").doc(input.characterId);

    return db.runTransaction(async (tx) => {
      const inviteSnap = await tx.get(invitationRef);
      if (!inviteSnap.exists) {
        throw new ActionError("NOT_FOUND", "Invitation not found.");
      }
      const invite = inviteSnap.data() ?? {};

      if (invite.status === "consumed") {
        throw new ActionError(
          "INVALID_STATE",
          "This invite has already been used.",
        );
      }
      if (invite.status === "revoked") {
        throw new ActionError(
          "INVALID_STATE",
          "This invite has been revoked.",
        );
      }
      if (invite.status !== "open") {
        throw new ActionError("INVALID_STATE", "This invite cannot be used.");
      }

      const expiresAt = invite.expiresAt as string | undefined;
      if (!expiresAt || new Date(expiresAt).getTime() <= Date.now()) {
        throw new ActionError("INVALID_STATE", "This invite has expired.");
      }

      const campaignId = invite.campaignId as string | undefined;
      if (!campaignId) {
        throw new ActionError("INVALID_STATE", "Invitation has no campaign.");
      }
      const campaignRef = db.collection("campaigns").doc(campaignId);

      const charSnap = await tx.get(characterRef);
      if (!charSnap.exists) {
        throw new ActionError("NOT_FOUND", "Character not found.");
      }
      const charData = charSnap.data() ?? {};
      if (charData.userId !== ctx.uid) {
        throw new ActionError(
          "FORBIDDEN",
          "You can only redeem with your own hero.",
        );
      }
      const charCampaignIds: string[] = Array.isArray(charData.campaignIds)
        ? charData.campaignIds
        : [];
      if (charCampaignIds.includes(campaignId)) {
        throw new ActionError(
          "INVALID_STATE",
          "This hero is already in that fellowship.",
        );
      }

      const campaignSnap = await tx.get(campaignRef);
      if (!campaignSnap.exists) {
        throw new ActionError("NOT_FOUND", "Campaign not found.");
      }
      const campData = campaignSnap.data() ?? {};
      const playerUids: string[] = Array.isArray(campData.playerUids)
        ? campData.playerUids
        : [];
      const characterIds: string[] = Array.isArray(campData.characterIds)
        ? campData.characterIds
        : [];
      const roster: RosterDoc[] = Array.isArray(campData.roster)
        ? (campData.roster as RosterDoc[])
        : [];

      if (playerUids.length >= ROSTER_LIMIT) {
        throw new ActionError("INVALID_STATE", "Fellowship roster is full.");
      }
      if (characterIds.includes(input.characterId)) {
        throw new ActionError(
          "INVALID_STATE",
          "This hero is already on the roster.",
        );
      }

      const identity = (charData.identity as Record<string, unknown>) ?? {};
      const rosterEntry = {
        characterId: input.characterId,
        characterName:
          (identity.name as string | undefined) || "Unnamed hero",
        playerUid: ctx.uid,
        avatarUrl:
          (identity.avatarUrl as string | null | undefined) ?? null,
        joinedAt: new Date().toISOString(),
      };
      const nextRoster = [...roster, rosterEntry];

      tx.update(characterRef, {
        campaignIds: FieldValue.arrayUnion(campaignId),
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.update(campaignRef, {
        characterIds: FieldValue.arrayUnion(input.characterId),
        playerUids: FieldValue.arrayUnion(ctx.uid),
        roster: nextRoster,
        updatedAt: FieldValue.serverTimestamp(),
      });

      tx.update(invitationRef, {
        status: "consumed",
        consumedByUid: ctx.uid,
        consumedAt: FieldValue.serverTimestamp(),
      });

      return {
        joinedCampaignId: campaignId,
        characterId: input.characterId,
      };
    });
  },
);
