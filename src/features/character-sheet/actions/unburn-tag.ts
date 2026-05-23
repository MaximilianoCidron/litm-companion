"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { UnburnTagInput } from "../schemas";
import { requireCharacterAccess } from "../lib/access";

type PowerTagDoc = {
  id: string;
  name: string;
  scratched: boolean;
  burned: boolean;
};

// Owner-or-GM action — does NOT call assertNotRetired. A burned tag on a
// retired hero can still be restored as a narrative ruling (e.g., fixing a
// pre-retirement mistake). All other gameplay mutations remain blocked.
export const unburnTag = withAction(
  UnburnTagInput,
  async (input, ctx): Promise<{ tagId: string; restored: true }> => {
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
      const powerTags: PowerTagDoc[] = Array.isArray(theme.powerTags)
        ? [...theme.powerTags]
        : [];
      const tagIdx = powerTags.findIndex((t) => t.id === input.tagId);
      if (tagIdx === -1) {
        throw new ActionError("NOT_FOUND", "Power tag not found on theme.");
      }
      const tag = { ...powerTags[tagIdx]! };
      if (!tag.burned) {
        throw new ActionError("INVALID_STATE", "Tag isn't burned.");
      }
      tag.burned = false;
      tag.scratched = false;
      powerTags[tagIdx] = tag;
      theme.powerTags = powerTags;
      themes[themeIdx] = theme;

      tx.update(access.snap.ref, {
        themes,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { tagId: input.tagId, restored: true as const };
    });
  },
);
