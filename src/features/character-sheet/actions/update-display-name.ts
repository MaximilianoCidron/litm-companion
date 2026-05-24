"use server";
import { getAdminAuth } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { UpdateDisplayNameInput } from "../schemas";

export const updateDisplayName = withAction(
  UpdateDisplayNameInput,
  async (input, ctx): Promise<{ displayName: string }> => {
    try {
      await getAdminAuth().updateUser(ctx.uid, {
        displayName: input.displayName,
      });
    } catch (err) {
      console.error("[update-display-name] failed", err);
      throw new ActionError(
        "INTERNAL",
        "We couldn't update your display name. Please try again.",
      );
    }
    return { displayName: input.displayName };
  },
);
