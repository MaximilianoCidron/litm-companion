"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { CampaignId, CampaignSchema, CreateCampaignInput } from "../schemas";
import { requireCharacterAccess } from "../lib/access";
import { buildBlankFellowship } from "../lib/campaign-factory";

const NOW_SENTINEL = "1970-01-01T00:00:00.000Z";

interface CreateCampaignResult {
  campaignId: string;
}

export const createCampaign = withAction(
  CreateCampaignInput,
  async (input, ctx): Promise<CreateCampaignResult> => {
    const db = getAdminDb();

    const campaignRef = db.collection("campaigns").doc();
    const campaignId = CampaignId.parse(campaignRef.id);

    const fellowship = buildBlankFellowship(input.name);

    // Optional auto-join: verify the requesting user owns the character first.
    let characterRosterEntry:
      | {
          characterId: string;
          characterName: string;
          playerUid: string;
          avatarUrl: string | null;
          joinedAt: string;
        }
      | null = null;
    let characterId: string | null = null;
    if (input.joinCharacterId) {
      const access = await requireCharacterAccess(
        input.joinCharacterId,
        ctx.uid,
      );
      if (access.role !== "owner") {
        throw new ActionError(
          "FORBIDDEN",
          "Only the character's owner can auto-join a new campaign.",
        );
      }
      const data = access.snap.data() ?? {};
      const identity = (data.identity as Record<string, unknown>) ?? {};
      characterRosterEntry = {
        characterId: access.snap.id,
        characterName: (identity.name as string | undefined) || "Unnamed hero",
        playerUid: (data.userId as string | undefined) ?? ctx.uid,
        avatarUrl: (identity.avatarUrl as string | null | undefined) ?? null,
        joinedAt: new Date().toISOString(),
      };
      characterId = access.snap.id;
    }

    const baseCampaign = {
      id: campaignId,
      name: input.name,
      gmUid: ctx.uid,
      fellowship,
      roster: characterRosterEntry ? [characterRosterEntry] : [],
      characterIds: characterId ? [characterId] : [],
      playerUids: characterRosterEntry
        ? [characterRosterEntry.playerUid]
        : [],
    };

    // Round-trip through Zod to catch drift before write.
    CampaignSchema.parse({
      ...baseCampaign,
      createdAt: NOW_SENTINEL,
      updatedAt: NOW_SENTINEL,
    });

    const batch = db.batch();
    batch.set(campaignRef, {
      ...baseCampaign,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (characterId) {
      const charRef = db.collection("characters").doc(characterId);
      batch.update(charRef, {
        campaignIds: FieldValue.arrayUnion(campaignId),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();
    return { campaignId };
  },
);
