"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { ReplaceThemeInput } from "../schemas";
import { assertNotRetired, requireCharacterAccess } from "../lib/access";
import { buildBlankTheme } from "../lib/character-factory";
import {
  getAuthorDisplayName,
  resolveActiveSessionId,
  summarizeThemeAdvancement,
  writeLogEntry,
} from "../lib/session-log";

const PROMISE_CAP = 5;

interface ReplaceThemeResult {
  oldThemeId: string;
  newThemeId: string;
  momentOfFulfillmentAvailable: boolean;
}

export const replaceTheme = withAction(
  ReplaceThemeInput,
  async (input, ctx): Promise<ReplaceThemeResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );

      const data = access.snap.data() ?? {};
      assertNotRetired(data); // retired-character guard

      // Pre-resolve active session in the read phase.
      const charCampaignIds = Array.isArray(data.campaignIds)
        ? (data.campaignIds as string[])
        : [];
      const logCampaignId = charCampaignIds[0] ?? null;
      const sessionId = logCampaignId
        ? await resolveActiveSessionId(tx, logCampaignId)
        : null;

      const themes = Array.isArray(data.themes)
        ? [...(data.themes as Record<string, unknown>[])]
        : [];
      const themeIdx = themes.findIndex(
        (t) => (t as { id: string }).id === input.themeId,
      );
      if (themeIdx === -1) {
        throw new ActionError("NOT_FOUND", "Theme not found on character.");
      }
      const original = themes[themeIdx] as Record<string, unknown>;
      const tracks = (original.tracks as Record<string, number> | undefined) ?? {};

      if ((tracks.abandon ?? 0) !== 3) {
        throw new ActionError(
          "INVALID_STATE",
          "Abandon track is not complete.",
        );
      }

      const newTheme = buildBlankTheme({
        type: input.newType,
        name: input.newName,
        quest: input.newQuest,
      });
      const oldThemeId = original.id as string;
      themes[themeIdx] = newTheme;

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

      if (logCampaignId) {
        const characterName =
          ((data.identity as Record<string, unknown> | undefined)?.name as
            | string
            | undefined) ?? "A hero";
        const oldThemeName = (original.name as string | undefined) ?? "";
        writeLogEntry(tx, {
          campaignId: logCampaignId,
          authorUid: ctx.uid,
          authorName: getAuthorDisplayName(ctx),
          subjectCharacterId: input.characterId,
          subjectCharacterName: characterName,
          text: summarizeThemeAdvancement(
            characterName,
            "replace",
            oldThemeName,
          ),
          details: {
            kind: "themeAdvancement",
            advancementKind: "replace",
            themeId: newTheme.id,
            themeName: oldThemeName,
          },
          sessionId,
        });
      } else {
        // eslint-disable-next-line no-console
        console.debug(
          "[session-log] replaceTheme outside campaign — no log entry emitted",
        );
      }

      return {
        oldThemeId,
        newThemeId: newTheme.id,
        momentOfFulfillmentAvailable: nextPromise === PROMISE_CAP,
      };
    });
  },
);
