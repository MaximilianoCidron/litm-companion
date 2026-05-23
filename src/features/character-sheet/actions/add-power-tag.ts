"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { AddPowerTagInput, PowerTagSchema, TagId } from "../schemas";
import { assertNotRetired, requireCharacterAccess } from "../lib/access";

const POWER_TAG_LIMIT = 12;

export const addPowerTag = withAction(
  AddPowerTagInput,
  async (input, ctx): Promise<{ tagId: string }> => {
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
      const powerTags = Array.isArray(theme.powerTags)
        ? [...theme.powerTags]
        : [];

      if (powerTags.length >= POWER_TAG_LIMIT) {
        throw new ActionError("INVALID_STATE", "Theme is at the tag limit.");
      }

      const tagId = crypto.randomUUID();
      const newTag = PowerTagSchema.parse({
        id: TagId.parse(tagId),
        name: input.name,
        scratched: false,
        burned: false,
      });

      powerTags.push(newTag);
      theme.powerTags = powerTags;
      themes[themeIdx] = theme;

      tx.update(access.snap.ref, {
        themes,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { tagId };
    });
  },
);
