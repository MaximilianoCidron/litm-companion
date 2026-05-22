"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  AddStoryTagInput,
  StoryTagSchema,
  TagId,
} from "../schemas";
import { requireCharacterAccess } from "../lib/access";

const STORY_TAG_LIMIT = 40;

type StoryTagDoc = {
  id: string;
  name: string;
  polarity: "helpful" | "hindering";
  isSingleUse: boolean;
  scratched: boolean;
};

export const addStoryTag = withAction(
  AddStoryTagInput,
  async (input, ctx): Promise<{ tagId: string }> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );

      const data = access.snap.data() ?? {};
      const backpack = (data.backpack as Record<string, unknown>) ?? {};
      const storyTags: StoryTagDoc[] = Array.isArray(backpack.storyTags)
        ? [...(backpack.storyTags as StoryTagDoc[])]
        : [];

      if (storyTags.length >= STORY_TAG_LIMIT) {
        throw new ActionError(
          "INVALID_STATE",
          "Backpack is at the story tag limit.",
        );
      }

      const tagId = crypto.randomUUID();
      const newTag = StoryTagSchema.parse({
        id: TagId.parse(tagId),
        name: input.name,
        polarity: input.polarity,
        isSingleUse: input.isSingleUse,
        scratched: false,
      });
      storyTags.push(newTag);

      tx.update(access.snap.ref, {
        "backpack.storyTags": storyTags,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { tagId };
    });
  },
);
