"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { EndCampActivityInput, type Character } from "../schemas";
import { requireCharacterAccess } from "../lib/access";
import { firestoreToCharacter } from "../lib/serialize";

interface EndCampActivityResult {
  activity: "rest" | "reflect" | "campAction";
  activityNote: string | null;
  summary: {
    powerTagsRefreshed: number;
    storyTagsDiscarded: number;
    statusesCleared: number;
    improveMarkedOnThemeId: string | null;
  };
}

export const endCampActivity = withAction(
  EndCampActivityInput,
  async (input, ctx): Promise<EndCampActivityResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const { snap } = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );
      const character = firestoreToCharacter(snap);

      // 1. Refresh non-burned power tags across all themes.
      //    burning is more permanent than scratching — survives camp.
      let powerTagsRefreshed = 0;
      const updatedThemes = character.themes.map((theme) => ({
        ...theme,
        powerTags: theme.powerTags.map((tag) => {
          if (tag.burned) return tag;
          if (tag.scratched) {
            powerTagsRefreshed += 1;
            return { ...tag, scratched: false };
          }
          return tag;
        }),
        tracks: { ...theme.tracks },
      })) as Character["themes"];

      // 2. Story tag cleanup: drop everything not explicitly preserved.
      //    Preserved survivors are also unscratched (fresh start after camp).
      const beforeStoryCount = character.backpack.storyTags.length;
      const updatedStoryTags = character.backpack.storyTags
        .filter((t) => t.preserved === true)
        .map((t) => ({ ...t, scratched: false }));
      const storyTagsDiscarded = beforeStoryCount - updatedStoryTags.length;

      // 3. Activity-specific effects.
      let updatedStatuses = character.statuses;
      let statusesCleared = 0;
      let improveMarkedOnThemeId: string | null = null;
      let activityNote: string | null = null;

      if (input.activity.kind === "rest") {
        statusesCleared = character.statuses.filter(
          (s) => s.polarity === "hindering",
        ).length;
        updatedStatuses = character.statuses.filter(
          (s) => s.polarity === "helpful",
        );
      } else if (input.activity.kind === "reflect") {
        const themeId = input.activity.themeId;
        const themeIdx = updatedThemes.findIndex((t) => t.id === themeId);
        if (themeIdx < 0) {
          throw new ActionError("NOT_FOUND", "Theme not found on character.");
        }
        const theme = updatedThemes[themeIdx]!;
        if (theme.tracks.improve >= 3) {
          throw new ActionError(
            "INVALID_STATE",
            "That theme's Improve track is already full — claim the improvement first.",
          );
        }
        updatedThemes[themeIdx] = {
          ...theme,
          tracks: { ...theme.tracks, improve: theme.tracks.improve + 1 },
        } as Character["themes"][number];
        improveMarkedOnThemeId = themeId;
      } else {
        const trimmed = input.activity.description.trim();
        activityNote = trimmed.length > 0 ? trimmed : null;
      }

      tx.update(snap.ref, {
        themes: updatedThemes,
        statuses: updatedStatuses,
        backpack: { ...character.backpack, storyTags: updatedStoryTags },
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        activity: input.activity.kind,
        activityNote,
        summary: {
          powerTagsRefreshed,
          storyTagsDiscarded,
          statusesCleared,
          improveMarkedOnThemeId,
        },
      };
    });
  },
);
