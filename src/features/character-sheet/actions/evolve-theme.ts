"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  EvolveThemeInput,
  inferMightLevel,
  nextMightLevel,
  type MightLevel,
} from "../schemas";
import { requireCharacterAccess } from "../lib/access";

const PROMISE_CAP = 5;

interface EvolveThemeResult {
  themeId: string;
  newMightLevel: MightLevel;
  momentOfFulfillmentAvailable: boolean;
}

export const evolveTheme = withAction(
  EvolveThemeInput,
  async (input, ctx): Promise<EvolveThemeResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );

      const data = access.snap.data() ?? {};
      const themes = Array.isArray(data.themes)
        ? [...(data.themes as Record<string, unknown>[])]
        : [];
      const themeIdx = themes.findIndex(
        (t) => (t as { id: string }).id === input.themeId,
      );
      if (themeIdx === -1) {
        throw new ActionError("NOT_FOUND", "Theme not found on character.");
      }
      const theme = { ...(themes[themeIdx] as Record<string, unknown>) };
      const tracks = {
        ...(theme.tracks as Record<string, number> | undefined),
      };

      if ((tracks.milestone ?? 0) !== 3) {
        throw new ActionError(
          "INVALID_STATE",
          "Milestone track is not complete.",
        );
      }

      const currentMightLevel = theme.mightLevel as MightLevel;
      const next = nextMightLevel(currentMightLevel);

      if (next !== null) {
        if (!input.newType) {
          throw new ActionError(
            "VALIDATION",
            "newType is required when the theme rises in might.",
          );
        }
        if (inferMightLevel(input.newType) !== next) {
          throw new ActionError(
            "VALIDATION",
            `newType prefix must match the next might level (${next}).`,
          );
        }
        theme.type = input.newType;
        theme.mightLevel = next;
      }

      if (input.newName) {
        theme.name = input.newName;
      }

      tracks.milestone = 0;
      theme.tracks = tracks;
      themes[themeIdx] = theme;

      const progression = {
        ...(data.progression as Record<string, unknown> | undefined),
      };
      const currentPromise = Number(progression.promise ?? 0);
      const nextPromise = Math.min(PROMISE_CAP, currentPromise + 1);
      progression.promise = nextPromise;

      tx.update(access.snap.ref, {
        themes,
        progression,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        themeId: input.themeId,
        newMightLevel: theme.mightLevel as MightLevel,
        momentOfFulfillmentAvailable: nextPromise === PROMISE_CAP,
      };
    });
  },
);
