"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { inferMightLevel, UpdateThemeInput } from "../schemas";
import { assertNotRetired, requireCharacterAccess } from "../lib/access";

export const updateTheme = withAction(
  UpdateThemeInput,
  async (input, ctx): Promise<{ themeId: string }> => {
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

      switch (input.patch.kind) {
        case "rename":
          theme.name = input.patch.name;
          break;
        case "retype":
          theme.type = input.patch.type;
          theme.mightLevel = inferMightLevel(input.patch.type);
          break;
        case "setQuest":
          theme.quest = input.patch.quest;
          break;
      }

      themes[themeIdx] = theme;
      tx.update(access.snap.ref, {
        themes,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { themeId: input.themeId };
    });
  },
);
