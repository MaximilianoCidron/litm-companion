"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  OfferReactionForThreatInput,
  type PendingConsequence,
} from "../schemas";
import { requireCampaignGm } from "../lib/access";
import {
  firestoreToChallenge,
  firestoreToCharacter,
} from "../lib/serialize";

interface OfferReactionResult {
  pendingThreatId: string;
}

export const offerReactionForThreat = withAction(
  OfferReactionForThreatInput,
  async (input, ctx): Promise<OfferReactionResult> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      await requireCampaignGm(input.campaignId, ctx.uid, tx);

      // Read challenge + threat.
      const challengeRef = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("challenges")
        .doc(input.challengeId);
      const challengeSnap = await tx.get(challengeRef);
      if (!challengeSnap.exists) {
        throw new ActionError("NOT_FOUND", "Challenge not found.");
      }
      const challenge = firestoreToChallenge(challengeSnap);
      const threat = challenge.threats.find((t) => t.id === input.threatId);
      if (!threat) {
        throw new ActionError("NOT_FOUND", "Threat not found.");
      }
      const template = threat.consequenceTemplate;
      if (template.kind !== "applyStatus" && template.kind !== "scratchTag") {
        throw new ActionError(
          "INVALID_STATE",
          "Reactions don't apply to this consequence kind. Use immediate delivery.",
        );
      }

      // Read target character.
      const charRef = db.collection("characters").doc(input.targetCharacterId);
      const charSnap = await tx.get(charRef);
      if (!charSnap.exists) {
        throw new ActionError("NOT_FOUND", "Target hero not found.");
      }
      const character = firestoreToCharacter(charSnap);
      if (!character.campaignIds.includes(input.campaignId)) {
        throw new ActionError(
          "INVALID_STATE",
          "That hero is not in this campaign.",
        );
      }

      // Build the consequence payload.
      let consequence: PendingConsequence;
      if (template.kind === "applyStatus") {
        consequence = {
          kind: "applyStatus",
          statusName: template.statusName,
          tier: template.tier,
          polarity: template.polarity,
        };
      } else {
        if (!input.scratchTarget) {
          throw new ActionError(
            "VALIDATION",
            "Scratch-tag reactions require a target tag.",
          );
        }
        // Snapshot the tag name. Look it up on the target character based
        // on the location discriminator.
        const { location, tagId } = input.scratchTarget;
        let tagName = "";
        if (location.kind === "theme") {
          const theme = character.themes.find((t) => t.id === location.themeId);
          const tag = theme?.powerTags.find((p) => p.id === tagId);
          if (!tag) {
            throw new ActionError("NOT_FOUND", "Power tag not found on theme.");
          }
          tagName = tag.name;
        } else if (location.kind === "backpack") {
          const tag = character.backpack.storyTags.find((s) => s.id === tagId);
          if (!tag) {
            throw new ActionError("NOT_FOUND", "Story tag not found.");
          }
          tagName = tag.name;
        } else {
          throw new ActionError(
            "INVALID_STATE",
            "Fellowship and relationship tags cannot be scratched by reactions.",
          );
        }
        consequence = {
          kind: "scratchTag",
          location,
          tagId,
          tagName,
        };
      }

      const ptRef = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("pendingThreats")
        .doc();
      tx.set(ptRef, {
        id: ptRef.id,
        campaignId: input.campaignId,
        initiatedByUid: ctx.uid,
        challengeId: input.challengeId,
        threatId: input.threatId,
        targetCharacterId: input.targetCharacterId,
        targetCharacterName: character.identity.name,
        targetUid: character.userId,
        consequence,
        status: "awaitingReaction",
        reactionRollId: null,
        reactionPower: null,
        resolution: { kind: "pending" },
        createdAt: FieldValue.serverTimestamp(),
        resolvedAt: null,
      });

      return { pendingThreatId: ptRef.id };
    });
  },
);
