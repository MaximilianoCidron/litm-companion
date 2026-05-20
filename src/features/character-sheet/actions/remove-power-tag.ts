"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { RemovePowerTagInput } from "../schemas";
import { requireCharacterAccess } from "../lib/access";

export const removePowerTag = withAction(
  RemovePowerTagInput,
  async (input, ctx): Promise<{ tagId: string; removed: true }> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );

      const data = access.snap.data() ?? {};
      const themes = Array.isArray(data.themes) ? [...data.themes] : [];
      const themeIdx = themes.findIndex(
        (t: { id: string }) => t.id === input.themeId,
      );
      if (themeIdx === -1) {
        throw new ActionError("NOT_FOUND", "Theme not found on character.");
      }
      const theme = { ...themes[themeIdx] };
      const powerTags: { id: string }[] = Array.isArray(theme.powerTags)
        ? theme.powerTags
        : [];

      const tagIdx = powerTags.findIndex((t) => t.id === input.tagId);
      if (tagIdx === -1) {
        throw new ActionError("NOT_FOUND", "Power tag not found on theme.");
      }

      theme.powerTags = powerTags.filter((_, i) => i !== tagIdx);
      themes[themeIdx] = theme;

      tx.update(access.snap.ref, {
        themes,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { tagId: input.tagId, removed: true };
    });
  },
);
