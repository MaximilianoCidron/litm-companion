// TODO(refactor): promote campaign subdomain to its own feature.
"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { RedeemDirectedInvitationInput } from "../schemas";
import { firestoreToCharacter, firestoreToInvitation } from "../lib/serialize";

const ROSTER_LIMIT = 8;

interface RosterDoc {
  characterId?: string;
  characterName?: string;
  playerUid?: string;
  avatarUrl?: string | null;
  joinedAt?: string;
}

interface RedeemResult {
  joinedCampaignId: string;
  campaignName: string;
  characterId: string;
}

export const redeemDirectedInvitation = withAction(
  RedeemDirectedInvitationInput,
  async (input, ctx): Promise<RedeemResult> => {
    const db = getAdminDb();
    const invitationRef = db
      .collection("invitations")
      .doc(input.invitationId);
    const characterRef = db.collection("characters").doc(input.characterId);

    return db.runTransaction(async (tx) => {
      // Read phase
      const invSnap = await tx.get(invitationRef);
      if (!invSnap.exists) {
        throw new ActionError("NOT_FOUND", "Invitation not found.");
      }
      const invitation = firestoreToInvitation(invSnap);

      if (invitation.kind !== "directed") {
        throw new ActionError(
          "INVALID_STATE",
          "This invitation isn't directed at a user.",
        );
      }
      if (invitation.directedAtUid !== ctx.uid) {
        throw new ActionError(
          "FORBIDDEN",
          "This invitation isn't addressed to you.",
        );
      }
      if (invitation.status !== "open") {
        throw new ActionError(
          "INVALID_STATE",
          "This invitation has already been resolved.",
        );
      }
      if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
        throw new ActionError(
          "INVALID_STATE",
          "This invitation has expired.",
        );
      }

      const charSnap = await tx.get(characterRef);
      if (!charSnap.exists) {
        throw new ActionError("NOT_FOUND", "Character not found.");
      }
      const character = firestoreToCharacter(charSnap);
      if (character.userId !== ctx.uid) {
        throw new ActionError("FORBIDDEN", "That character isn't yours.");
      }
      if (character.status === "retired") {
        throw new ActionError(
          "INVALID_STATE",
          "Retired heroes can't join campaigns.",
        );
      }
      if (character.campaignIds.includes(invitation.campaignId)) {
        throw new ActionError(
          "INVALID_STATE",
          "This hero is already in that fellowship.",
        );
      }

      const campaignRef = db.collection("campaigns").doc(invitation.campaignId);
      const campaignSnap = await tx.get(campaignRef);
      if (!campaignSnap.exists) {
        throw new ActionError("NOT_FOUND", "Campaign no longer exists.");
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

      // Write phase
      const rosterEntry: RosterDoc = {
        characterId: input.characterId,
        characterName: character.identity.name || "Unnamed hero",
        playerUid: ctx.uid,
        avatarUrl: character.identity.avatarUrl ?? null,
        joinedAt: new Date().toISOString(),
      };
      const nextRoster = [...roster, rosterEntry];

      tx.update(characterRef, {
        campaignIds: FieldValue.arrayUnion(invitation.campaignId),
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
        joinedCampaignId: invitation.campaignId,
        campaignName: invitation.campaignName,
        characterId: input.characterId,
      };
    });
  },
);
