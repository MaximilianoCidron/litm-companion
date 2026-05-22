"use server";
import { FieldValue } from "firebase-admin/firestore";
import type {
  DocumentReference,
  Transaction,
} from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { UpdateTagInput, type UpdateTagInput as UpdateTagInputT } from "../schemas";
import { requireCampaignGm, requireCharacterAccess } from "../lib/access";

interface UpdateTagResult {
  tagId: string;
  newName?: string;
  scratched?: boolean;
}

type PowerTagDoc = {
  id: string;
  name: string;
  scratched: boolean;
  burned: boolean;
};

type StoryTagDoc = {
  id: string;
  name: string;
  polarity: "helpful" | "hindering";
  isSingleUse: boolean;
  scratched: boolean;
};

export const updateTag = withAction(
  UpdateTagInput,
  async (input, ctx): Promise<UpdateTagResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      if (input.location.kind === "fellowship") {
        return applyToFellowship(input, ctx.uid, tx);
      }

      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );
      const data = access.snap.data() ?? {};

      if (input.location.kind === "theme") {
        return applyToTheme(input, data, access.snap.ref, tx);
      }
      return applyToBackpack(input, data, access.snap.ref, tx);
    });
  },
);

async function applyToFellowship(
  input: UpdateTagInputT,
  uid: string,
  tx: Transaction,
): Promise<UpdateTagResult> {
  if (input.location.kind !== "fellowship") {
    throw new Error("applyToFellowship: wrong location kind");
  }
  if (input.patch.kind === "scratch") {
    // v1: fellowship tags don't track scratched/burned state — the camp/rest
    // flow is deferred. Reject so callers know they shouldn't try.
    throw new ActionError(
      "INVALID_STATE",
      "Fellowship tags don't support scratching yet.",
    );
  }

  const { campaignId, tagId } = input.location;
  const { snap } = await requireCampaignGm(campaignId, uid, tx);
  const data = snap.data() ?? {};
  const fellowship = (data.fellowship as Record<string, unknown>) ?? {};

  const powerTags = Array.isArray(fellowship.powerTags)
    ? [...(fellowship.powerTags as { id: string; name: string }[])]
    : [];
  const weakness = fellowship.weaknessTag as
    | { id: string; name: string }
    | undefined;
  const powerIdx = powerTags.findIndex((t) => t.id === tagId);
  const isWeakness = weakness?.id === tagId;

  if (powerIdx === -1 && !isWeakness) {
    throw new ActionError("NOT_FOUND", "Fellowship tag not found.");
  }

  let updatedFellowship: Record<string, unknown>;
  if (powerIdx !== -1) {
    const tag = { ...powerTags[powerIdx]!, name: input.patch.name };
    powerTags[powerIdx] = tag;
    updatedFellowship = { ...fellowship, powerTags };
  } else {
    updatedFellowship = {
      ...fellowship,
      weaknessTag: { ...weakness!, name: input.patch.name },
    };
  }

  tx.update(snap.ref, {
    fellowship: updatedFellowship,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return { tagId, newName: input.patch.name };
}

function applyToTheme(
  input: UpdateTagInputT,
  data: Record<string, unknown>,
  ref: DocumentReference,
  tx: Transaction,
): UpdateTagResult {
  if (input.location.kind !== "theme") {
    throw new Error("applyToTheme: wrong location kind");
  }
  const { themeId, tagId } = input.location;

  const themes = Array.isArray(data.themes)
    ? [...(data.themes as Record<string, unknown>[])]
    : [];
  const themeIdx = themes.findIndex(
    (t) => (t as { id: string }).id === themeId,
  );
  if (themeIdx === -1) {
    throw new ActionError("NOT_FOUND", "Theme not found on character.");
  }
  const theme = { ...(themes[themeIdx] as Record<string, unknown>) };

  const powerTags: PowerTagDoc[] = Array.isArray(theme.powerTags)
    ? [...(theme.powerTags as PowerTagDoc[])]
    : [];
  const powerIdx = powerTags.findIndex((t) => t.id === tagId);
  const weakness = theme.weaknessTag as { id: string; name: string } | undefined;
  const isWeakness = weakness?.id === tagId;

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
      theme.weaknessTag = { ...weakness!, name: input.patch.name };
    }
    result = { tagId, newName: input.patch.name };
  } else {
    if (isWeakness) {
      throw new ActionError(
        "INVALID_STATE",
        "Weakness tags cannot be scratched.",
      );
    }
    const tag = { ...powerTags[powerIdx]! };
    if (tag.burned && !input.patch.scratched) {
      throw new ActionError(
        "INVALID_STATE",
        "Cannot un-scratch a burned tag.",
      );
    }
    tag.scratched = input.patch.scratched;
    powerTags[powerIdx] = tag;
    theme.powerTags = powerTags;
    result = { tagId, scratched: input.patch.scratched };
  }

  themes[themeIdx] = theme;
  tx.update(ref, {
    themes,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return result;
}

function applyToBackpack(
  input: UpdateTagInputT,
  data: Record<string, unknown>,
  ref: DocumentReference,
  tx: Transaction,
): UpdateTagResult {
  if (input.location.kind !== "backpack") {
    throw new Error("applyToBackpack: wrong location kind");
  }
  const { tagId } = input.location;

  const backpack = (data.backpack as Record<string, unknown>) ?? {};
  const storyTags: StoryTagDoc[] = Array.isArray(backpack.storyTags)
    ? [...(backpack.storyTags as StoryTagDoc[])]
    : [];
  const idx = storyTags.findIndex((t) => t.id === tagId);
  if (idx === -1) {
    throw new ActionError("NOT_FOUND", "Story tag not found in backpack.");
  }
  const tag = { ...storyTags[idx]! };

  let result: UpdateTagResult;
  if (input.patch.kind === "rename") {
    tag.name = input.patch.name;
    result = { tagId, newName: input.patch.name };
  } else {
    tag.scratched = input.patch.scratched;
    result = { tagId, scratched: input.patch.scratched };
  }
  storyTags[idx] = tag;

  tx.update(ref, {
    "backpack.storyTags": storyTags,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return result;
}
