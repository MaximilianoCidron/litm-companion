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
import { assertNotRetired, requireCharacterAccess } from "../lib/access";
import {
  getAuthorDisplayName,
  resolveActiveSessionId,
  summarizeThemeAdvancement,
  writeLogEntry,
} from "../lib/session-log";

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

      if (logCampaignId) {
        const characterName =
          ((data.identity as Record<string, unknown> | undefined)?.name as
            | string
            | undefined) ?? "A hero";
        const themeName = (theme.name as string | undefined) ?? "";
        const finalMight = theme.mightLevel as MightLevel;
        writeLogEntry(tx, {
          campaignId: logCampaignId,
          authorUid: ctx.uid,
          authorName: getAuthorDisplayName(ctx),
          subjectCharacterId: input.characterId,
          subjectCharacterName: characterName,
          text: summarizeThemeAdvancement(
            characterName,
            "evolve",
            themeName,
            next ? finalMight : undefined,
          ),
          details: {
            kind: "themeAdvancement",
            advancementKind: "evolve",
            themeId: input.themeId,
            themeName,
            newMightLevel: next ? finalMight : undefined,
          },
          sessionId,
        });
      } else {
        // eslint-disable-next-line no-console
        console.debug(
          "[session-log] evolveTheme outside campaign — no log entry emitted",
        );
      }

      return {
        themeId: input.themeId,
        newMightLevel: theme.mightLevel as MightLevel,
        momentOfFulfillmentAvailable: nextPromise === PROMISE_CAP,
      };
    });
  },
);
