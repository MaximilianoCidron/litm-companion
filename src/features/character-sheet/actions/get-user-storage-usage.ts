"use server";
import { z } from "zod";
import { withAction } from "@/shared/auth";
import { getUserStorageUsage } from "../lib/queries";

/**
 * Read the caller's Firebase Storage usage (per-character breakdown + orphan
 * detection). Takes no input — the uid comes from the verified session, so
 * there is no surface for cross-user access.
 */
export const getUserStorageUsageAction = withAction(
  z.object({}),
  async (_input, ctx) => {
    return getUserStorageUsage(ctx.uid);
  },
);
