"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  MomentOfFulfillmentEntryId,
  QuintessenceId,
  ResolveMomentOfFulfillmentInput,
  TagId,
  type MomentOfFulfillmentEntry,
  type MomentOfFulfillmentPath,
  type Quintessence,
} from "../schemas";
import { requireCharacterOwnership } from "../lib/access";
import { firestoreToCharacter } from "../lib/serialize";
import { buildBlankTheme } from "../lib/character-factory";
import {
  getAuthorDisplayName,
  resolveActiveSessionId,
  writeLogEntry,
} from "../lib/session-log";

interface ResolveMomentOfFulfillmentResult {
  path: MomentOfFulfillmentPath;
  entryId: string;
  shouldRedirectToDashboard: boolean;
}

const PATH_VERBS: Record<MomentOfFulfillmentPath, string> = {
  retire: "retired from the story",
  reforge: "reforged a theme",
  gainQuintessence: "crystallized a quintessence",
  shakeWorld: "shook the world",
  speakWordsEternal: "spoke words eternal",
  unearthTruths: "unearthed a truth",
};

export const resolveMomentOfFulfillment = withAction(
  ResolveMomentOfFulfillmentInput,
  async (input, ctx): Promise<ResolveMomentOfFulfillmentResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      // Owner-only. GM cannot trigger another player's Moment of Fulfillment.
      const { snap } = await requireCharacterOwnership(
        input.characterId,
        ctx.uid,
        tx,
      );
      const character = firestoreToCharacter(snap);

      // Pre-resolve active session in the read phase.
      const logCampaignId = character.campaignIds[0] ?? null;
      const sessionId = logCampaignId
        ? await resolveActiveSessionId(tx, logCampaignId)
        : null;

      if (character.status === "retired") {
        throw new ActionError(
          "INVALID_STATE",
          "This hero has retired — no further moments.",
        );
      }
      if (character.progression.promise !== 5) {
        throw new ActionError(
          "INVALID_STATE",
          "Promise must be fulfilled (5/5) before a Moment of Fulfillment.",
        );
      }

      const resolvedAt = new Date().toISOString();
      const entryId = MomentOfFulfillmentEntryId.parse(crypto.randomUUID());

      const update: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };
      let pathSnapshot: string;
      let newEntry: MomentOfFulfillmentEntry;
      // Bind to a local so TypeScript's narrowing survives across the switch
      // body. (Discriminated narrowing on `input.resolution.path` doesn't
      // propagate to deeper property accesses in some TS configurations.)
      const resolution = input.resolution;

      switch (resolution.path) {
        case "retire": {
          newEntry = {
            id: entryId,
            path: "retire",
            resolvedAt,
            finalWords: resolution.finalWords,
          };
          update.status = "retired";
          // Retire freezes promise at 5 — explicit "ended" signal.
          update.momentsOfFulfillment = [
            ...character.momentsOfFulfillment,
            newEntry,
          ];
          pathSnapshot = "retired from the story";
          break;
        }

        case "reforge": {
          const themeIndex = character.themes.findIndex(
            (t) => t.id === resolution.themeIdToReplace,
          );
          if (themeIndex < 0) {
            throw new ActionError("NOT_FOUND", "Theme to reforge not found.");
          }
          const oldTheme = character.themes[themeIndex]!;
          const newTheme = buildBlankTheme({
            name: resolution.newThemeName,
            type: resolution.newThemeType,
            quest: resolution.newQuest,
          });

          const newThemes = [...character.themes];
          newThemes[themeIndex] = newTheme;

          newEntry = {
            id: entryId,
            path: "reforge",
            resolvedAt,
            replacedThemeName: oldTheme.name || "Unnamed theme",
            newThemeId: newTheme.id,
            newThemeName: newTheme.name,
            narrativeDescription: resolution.narrativeDescription,
          };
          update.themes = newThemes;
          update.progression = { promise: 0 };
          update.momentsOfFulfillment = [
            ...character.momentsOfFulfillment,
            newEntry,
          ];
          pathSnapshot = `reforged "${oldTheme.name || "Unnamed theme"}" into "${newTheme.name}"`;
          break;
        }

        case "gainQuintessence": {
          if (character.quintessences.length >= 20) {
            throw new ActionError(
              "INVALID_STATE",
              "Quintessence list is at the limit.",
            );
          }
          const newQuintessence: Quintessence = {
            id: QuintessenceId.parse(crypto.randomUUID()),
            name: resolution.quintessenceName,
            scratched: false,
            sourceMoFEntryId: entryId,
            createdAt: resolvedAt,
          };
          newEntry = {
            id: entryId,
            path: "gainQuintessence",
            resolvedAt,
            quintessenceName: resolution.quintessenceName,
            narrativeDescription: resolution.narrativeDescription,
          };
          update.quintessences = [...character.quintessences, newQuintessence];
          update.progression = { promise: 0 };
          update.momentsOfFulfillment = [
            ...character.momentsOfFulfillment,
            newEntry,
          ];
          pathSnapshot = `crystallized "${resolution.quintessenceName}"`;
          break;
        }

        case "shakeWorld": {
          newEntry = {
            id: entryId,
            path: "shakeWorld",
            resolvedAt,
            narrativeDescription: resolution.narrativeDescription,
          };
          update.progression = { promise: 0 };
          update.momentsOfFulfillment = [
            ...character.momentsOfFulfillment,
            newEntry,
          ];
          pathSnapshot = "shook the world";
          break;
        }

        case "speakWordsEternal": {
          const themeIndex = character.themes.findIndex(
            (t) => t.id === resolution.themeId,
          );
          if (themeIndex < 0) {
            throw new ActionError("NOT_FOUND", "Target theme not found.");
          }
          const targetTheme = character.themes[themeIndex]!;
          const newPowerTagId = TagId.parse(crypto.randomUUID());
          const newPowerTag = {
            id: newPowerTagId,
            name: resolution.newPowerTagName,
            burned: false,
            scratched: false,
          };
          const updatedTheme = {
            ...targetTheme,
            powerTags: [...targetTheme.powerTags, newPowerTag],
          };
          const newThemes = [...character.themes];
          newThemes[themeIndex] = updatedTheme;

          newEntry = {
            id: entryId,
            path: "speakWordsEternal",
            resolvedAt,
            themeId: targetTheme.id,
            themeName: targetTheme.name || "Unnamed theme",
            newPowerTagName: resolution.newPowerTagName,
            newPowerTagId,
            narrativeDescription: resolution.narrativeDescription,
          };
          update.themes = newThemes;
          update.progression = { promise: 0 };
          update.momentsOfFulfillment = [
            ...character.momentsOfFulfillment,
            newEntry,
          ];
          pathSnapshot = `spoke "${resolution.newPowerTagName}" into "${targetTheme.name || "Unnamed theme"}"`;
          break;
        }

        case "unearthTruths": {
          newEntry = {
            id: entryId,
            path: "unearthTruths",
            resolvedAt,
            narrativeDescription: resolution.narrativeDescription,
          };
          update.progression = { promise: 0 };
          update.momentsOfFulfillment = [
            ...character.momentsOfFulfillment,
            newEntry,
          ];
          pathSnapshot = "unearthed a truth";
          break;
        }
      }

      tx.update(snap.ref, update);

      if (logCampaignId) {
        const verb = PATH_VERBS[input.resolution.path];
        const characterName = character.identity.name || "A hero";
        writeLogEntry(tx, {
          campaignId: logCampaignId,
          authorUid: ctx.uid,
          authorName: getAuthorDisplayName(ctx),
          subjectCharacterId: input.characterId,
          subjectCharacterName: characterName,
          text: `${characterName} ${verb}.`,
          details: {
            kind: "momentOfFulfillment",
            path: input.resolution.path,
            pathSnapshot,
          },
          sessionId,
        });
      }

      return {
        path: input.resolution.path,
        entryId,
        shouldRedirectToDashboard: input.resolution.path === "retire",
      };
    });
  },
);
