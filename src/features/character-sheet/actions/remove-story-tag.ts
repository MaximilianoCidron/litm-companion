"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { RemoveStoryTagInput } from "../schemas";
import { assertNotRetired, requireCharacterAccess } from "../lib/access";

type StoryTagDoc = {
  id: string;
  name: string;
  polarity: "helpful" | "hindering";
  isSingleUse: boolean;
  scratched: boolean;
};

export const removeStoryTag = withAction(
  RemoveStoryTagInput,
  async (input, ctx): Promise<{ tagId: string; removed: true }> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );

      const data = access.snap.data() ?? {};
      assertNotRetired(data); // retired-character guard
      const backpack = (data.backpack as Record<string, unknown>) ?? {};
      const storyTags: StoryTagDoc[] = Array.isArray(backpack.storyTags)
        ? (backpack.storyTags as StoryTagDoc[])
        : [];

      const next = storyTags.filter((t) => t.id !== input.tagId);
      if (next.length === storyTags.length) {
        throw new ActionError("NOT_FOUND", "Story tag not found in backpack.");
      }

      tx.update(access.snap.ref, {
        "backpack.storyTags": next,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { tagId: input.tagId, removed: true as const };
    });
  },
);
