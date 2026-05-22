// TODO(refactor): promote campaign subdomain to its own feature.
"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { KickFromCampaignInput } from "../schemas";
import { requireCampaignGm } from "../lib/access";

interface RosterDoc {
  characterId?: string;
  playerUid?: string;
}

interface KickResult {
  kicked: true;
  characterId: string;
}

export const kickFromCampaign = withAction(
  KickFromCampaignInput,
  async (input, ctx): Promise<KickResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const { snap: campaignSnap } = await requireCampaignGm(
        input.campaignId,
        ctx.uid,
        tx,
      );
      const campData = campaignSnap.data() ?? {};
      const gmUid = campData.gmUid as string | undefined;

      const characterRef = db
        .collection("characters")
        .doc(input.characterId);
      const charSnap = await tx.get(characterRef);
      if (!charSnap.exists) {
        throw new ActionError("NOT_FOUND", "Character not found.");
      }
      const charData = charSnap.data() ?? {};
      const charOwnerUid = charData.userId as string | undefined;
      if (charOwnerUid && charOwnerUid === gmUid) {
        throw new ActionError(
          "INVALID_STATE",
          "GM cannot kick their own hero. Transfer the GM role first.",
        );
      }

      const roster: RosterDoc[] = Array.isArray(campData.roster)
        ? (campData.roster as RosterDoc[])
        : [];
      const nextRoster = roster.filter(
        (r) => r.characterId !== input.characterId,
      );
      if (nextRoster.length === roster.length) {
        throw new ActionError(
          "NOT_FOUND",
          "Character is not in this campaign.",
        );
      }

      // Keep playerUid in playerUids if they have any other character in the
      // roster — security rules would otherwise drop their read access while
      // they're still active in the party with another hero.
      const remainingPlayerUids = new Set<string>(
        nextRoster
          .map((r) => r.playerUid)
          .filter((p): p is string => typeof p === "string"),
      );
      const stillMember =
        charOwnerUid !== undefined && remainingPlayerUids.has(charOwnerUid);

      tx.update(characterRef, {
        campaignIds: FieldValue.arrayRemove(input.campaignId),
        updatedAt: FieldValue.serverTimestamp(),
      });

      const update: Record<string, unknown> = {
        characterIds: FieldValue.arrayRemove(input.characterId),
        roster: nextRoster,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (!stillMember && charOwnerUid) {
        update.playerUids = FieldValue.arrayRemove(charOwnerUid);
      }
      tx.update(campaignSnap.ref, update);

      return { kicked: true as const, characterId: input.characterId };
    });
  },
);
