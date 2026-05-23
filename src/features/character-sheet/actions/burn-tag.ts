"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { BurnTagInput } from "../schemas";
import { assertNotRetired, requireCharacterAccess } from "../lib/access";

export const burnTag = withAction(
  BurnTagInput,
  async (input, ctx): Promise<{ tagId: string; burned: true }> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );

      const data = access.snap.data() ?? {};
      assertNotRetired(data); // retired-character guard
      const themes = Array.isArray(data.themes) ? [...data.themes] : [];
      const themeIdx = themes.findIndex(
        (t: { id: string }) => t.id === input.themeId,
      );
      if (themeIdx === -1) {
        throw new ActionError("NOT_FOUND", "Theme not found on character.");
      }
      const theme = { ...themes[themeIdx] };

      if (theme.weaknessTag?.id === input.tagId) {
        throw new ActionError(
          "INVALID_STATE",
          "Weakness tags cannot be burned.",
        );
      }

      const powerTags: { id: string; name: string; scratched: boolean; burned: boolean }[] =
        Array.isArray(theme.powerTags) ? [...theme.powerTags] : [];
      const tagIdx = powerTags.findIndex((t) => t.id === input.tagId);
      if (tagIdx === -1) {
        throw new ActionError("NOT_FOUND", "Power tag not found on theme.");
      }

      const tag = { ...powerTags[tagIdx]! };
      if (tag.burned) {
        throw new ActionError("INVALID_STATE", "Tag already burned.");
      }
      tag.burned = true;
      tag.scratched = true;
      powerTags[tagIdx] = tag;
      theme.powerTags = powerTags;
      themes[themeIdx] = theme;

      tx.update(access.snap.ref, {
        themes,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { tagId: input.tagId, burned: true };
    });
  },
);
