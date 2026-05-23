"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { MarkTrackInput } from "../schemas";
import { assertNotRetired, requireCharacterAccess } from "../lib/access";

interface MarkTrackResult {
  themeId: string;
  track: "improve" | "milestone" | "abandon";
  before: number;
  after: number;
  advancementAvailable: boolean;
}

const TRACK_MAX = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const markTrack = withAction(
  MarkTrackInput,
  async (input, ctx): Promise<MarkTrackResult> => {
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
      const tracks = { ...(theme.tracks ?? {}) };

      const before: number = Number(tracks[input.track] ?? 0);
      const after = clamp(before + input.delta, 0, TRACK_MAX);

      if (after === before) {
        // No-op (already at floor or ceiling). Still return the snapshot.
        return {
          themeId: input.themeId,
          track: input.track,
          before,
          after,
          advancementAvailable: false,
        };
      }

      tracks[input.track] = after;
      theme.tracks = tracks;
      themes[themeIdx] = theme;

      tx.update(access.snap.ref, {
        themes,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        themeId: input.themeId,
        track: input.track,
        before,
        after,
        advancementAvailable: after === TRACK_MAX && input.delta > 0,
      };
    });
  },
);
