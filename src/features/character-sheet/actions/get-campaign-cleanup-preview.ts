"use server";
import { withAction } from "@/shared/auth";
import { GetCampaignCleanupPreviewInput } from "../schemas";
import {
  getCampaignCleanupPreview,
  type CampaignCleanupPreview,
} from "../lib/queries";

export const getCampaignCleanupPreviewAction = withAction(
  GetCampaignCleanupPreviewInput,
  async (input, ctx): Promise<CampaignCleanupPreview> => {
    return getCampaignCleanupPreview(input.campaignId, ctx.uid);
  },
);
