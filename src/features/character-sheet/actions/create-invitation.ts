// TODO(refactor): promote campaign subdomain to its own feature.
"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { withAction } from "@/shared/auth";
import {
  CreateInvitationInput,
  InvitationId,
  InvitationSchema,
} from "../schemas";
import { requireCampaignGm } from "../lib/access";

const ISO_SENTINEL = "1970-01-01T00:00:00.000Z";

interface CreateInvitationResult {
  invitationId: string;
  expiresAt: string;
}

export const createInvitation = withAction(
  CreateInvitationInput,
  async (input, ctx): Promise<CreateInvitationResult> => {
    const db = getAdminDb();
    const { snap } = await requireCampaignGm(input.campaignId, ctx.uid);
    const campaignName = (snap.data()?.name as string | undefined) ?? "";

    const expiresAt = new Date(
      Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const invitationRef = db.collection("invitations").doc();
    const invitationId = InvitationId.parse(invitationRef.id);

    // Round-trip through Zod to catch drift before write. createdAt
    // becomes a serverTimestamp at write time, so use a sentinel for the
    // validation pass.
    InvitationSchema.parse({
      id: invitationId,
      campaignId: input.campaignId,
      campaignName,
      invitedByUid: ctx.uid,
      status: "open",
      consumedByUid: null,
      consumedAt: null,
      createdAt: ISO_SENTINEL,
      expiresAt,
    });

    await invitationRef.set({
      id: invitationId,
      campaignId: input.campaignId,
      campaignName,
      invitedByUid: ctx.uid,
      status: "open",
      consumedByUid: null,
      consumedAt: null,
      createdAt: FieldValue.serverTimestamp(),
      expiresAt,
    });

    return { invitationId, expiresAt };
  },
);
