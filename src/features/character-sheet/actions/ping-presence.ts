"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { withAction } from "@/shared/auth";
import { PingPresenceInput } from "../schemas";
import { getAuthorDisplayName } from "../lib/session-log";

export const pingPresence = withAction(
  PingPresenceInput,
  async (input, ctx): Promise<{ ok: true }> => {
    const db = getAdminDb();
    const displayName = getAuthorDisplayName(ctx);
    const ref = db.collection("presence").doc(ctx.uid);
    // Full overwrite — heartbeat is authoritative for the entire doc.
    await ref.set({
      uid: ctx.uid,
      displayName,
      lastSeenAt: FieldValue.serverTimestamp(),
      currentCampaignId: input.campaignId,
      currentCharacterId: input.characterId,
    });
    return { ok: true };
  },
);
