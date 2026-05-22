// TODO(refactor): promote campaign subdomain to its own feature.
"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { withAction } from "@/shared/auth";
import { RenameCampaignInput } from "../schemas";
import { requireCampaignGm } from "../lib/access";

const OPEN_INVITE_REFRESH_CAP = 20;

interface RenameResult {
  renamed: true;
  name: string;
}

export const renameCampaign = withAction(
  RenameCampaignInput,
  async (input, ctx): Promise<RenameResult> => {
    const db = getAdminDb();
    await requireCampaignGm(input.campaignId, ctx.uid);

    const campaignRef = db.collection("campaigns").doc(input.campaignId);

    // Refresh denormalized campaignName on every open invitation so /invite
    // landing pages don't show a stale name. Cap protects against runaway
    // batches; the typical campaign has < 5 open invites.
    const openInvitesSnap = await db
      .collection("invitations")
      .where("campaignId", "==", input.campaignId)
      .where("status", "==", "open")
      .limit(OPEN_INVITE_REFRESH_CAP)
      .get();

    const batch = db.batch();
    batch.update(campaignRef, {
      name: input.name,
      updatedAt: FieldValue.serverTimestamp(),
    });
    for (const inv of openInvitesSnap.docs) {
      batch.update(inv.ref, { campaignName: input.name });
    }
    await batch.commit();

    return { renamed: true as const, name: input.name };
  },
);
