"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { UpdateTagInput } from "../schemas";
import { requireCharacterAccess } from "../lib/access";

interface UpdateTagResult {
  tagId: string;
  newName?: string;
  scratched?: boolean;
}

export const updateTag = withAction(
  UpdateTagInput,
  async (input, ctx): Promise<UpdateTagResult> => {
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

      const powerTags: { id: string; name: string; scratched: boolean; burned: boolean }[] =
        Array.isArray(theme.powerTags) ? [...theme.powerTags] : [];
      const powerIdx = powerTags.findIndex((t) => t.id === input.tagId);

      const isWeakness =
        theme.weaknessTag && theme.weaknessTag.id === input.tagId;

      if (powerIdx === -1 && !isWeakness) {
        throw new ActionError("NOT_FOUND", "Tag not found on theme.");
      }

      let result: UpdateTagResult;

      if (input.patch.kind === "rename") {
        if (powerIdx !== -1) {
          const tag = { ...powerTags[powerIdx]! };
          tag.name = input.patch.name;
          powerTags[powerIdx] = tag;
          theme.powerTags = powerTags;
        } else {
          theme.weaknessTag = {
            ...theme.weaknessTag,
            name: input.patch.name,
          };
        }
        result = { tagId: input.tagId, newName: input.patch.name };
      } else {
        // scratch
        if (isWeakness) {
          throw new ActionError(
            "INVALID_STATE",
            "Weakness tags cannot be scratched.",
          );
        }
        const tag = { ...powerTags[powerIdx]! };
        if (tag.burned && !input.patch.scratched) {
          // Unscratching a burned tag is not allowed (burning implies scratched).
          throw new ActionError(
            "INVALID_STATE",
            "Cannot un-scratch a burned tag.",
          );
        }
        tag.scratched = input.patch.scratched;
        powerTags[powerIdx] = tag;
        theme.powerTags = powerTags;
        result = { tagId: input.tagId, scratched: input.patch.scratched };
      }

      themes[themeIdx] = theme;
      tx.update(access.snap.ref, {
        themes,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return result;
    });
  },
);
