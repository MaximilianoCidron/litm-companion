"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  ResolveMomentOfFulfillmentInput,
  type Character,
  type MomentOfFulfillmentEntry,
} from "../schemas";
import { requireCharacterOwnership } from "../lib/access";
import { firestoreToCharacter } from "../lib/serialize";
import { buildBlankTheme } from "../lib/character-factory";
import { buildSummaryMessage } from "../lib/moment-of-fulfillment";
import {
  getAuthorDisplayName,
  summarizeMomentOfFulfillment,
  writeLogEntry,
} from "../lib/session-log";

const QUINTESSENCE_LIMIT = 20;

interface ResolveMomentOfFulfillmentResult {
  path: ResolveMomentOfFulfillmentInput["choice"]["kind"];
  burnedTagsRestored: number;
  entryId: string;
  summaryMessage: string;
}

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

      if (character.status === "retired") {
        throw new ActionError(
          "INVALID_STATE",
          "This hero has retired — no further moments.",
        );
      }
      if (character.progression.promise !== 5) {
        throw new ActionError(
          "INVALID_STATE",
          "Your Promise track isn't full yet.",
        );
      }

      const choice = input.choice;
      const entry: MomentOfFulfillmentEntry = {
        id: crypto.randomUUID(),
        chosenPath: choice.kind,
        description: "description" in choice ? choice.description : "",
        burnedTagsRestored: 0,
        completedAt: new Date().toISOString(),
      };

      // Working copies — mutated below by path branch + burned restoration.
      let nextThemes = character.themes.map((t) => ({
        ...t,
        powerTags: t.powerTags.map((p) => ({ ...p })),
        tracks: { ...t.tracks },
      })) as Character["themes"];
      let nextStatuses = character.statuses;
      let nextBackpack = character.backpack;
      let nextIdentity = character.identity;
      let nextQuintessences = character.progression.quintessences;
      let nextStatus: Character["status"] = character.status;
      let didReforge = false;

      switch (choice.kind) {
        case "retire":
          nextStatus = "retired";
          break;
        case "reforge": {
          didReforge = true;
          nextThemes = [
            buildBlankTheme(),
            buildBlankTheme(),
            buildBlankTheme(),
            buildBlankTheme(),
          ] as Character["themes"];
          nextStatuses = [];
          nextBackpack = { storyTags: [], notes: "" };
          if (choice.newName) {
            nextIdentity = {
              ...character.identity,
              name: choice.newName,
              concept: choice.newConcept ?? character.identity.concept,
            };
          } else if (choice.newConcept !== undefined) {
            nextIdentity = {
              ...character.identity,
              concept: choice.newConcept,
            };
          }
          break;
        }
        case "gainQuintessence": {
          if (character.progression.quintessences.length >= QUINTESSENCE_LIMIT) {
            throw new ActionError(
              "INVALID_STATE",
              "Quintessence list is at the limit.",
            );
          }
          nextQuintessences = [
            ...character.progression.quintessences,
            choice.text,
          ];
          break;
        }
        case "shakeWorld":
        case "speakWordsEternal":
        case "unearthTruths":
          // No mechanical effect beyond the history entry.
          break;
      }

      // Burned-tag restoration runs AFTER reforge. After reforge the themes
      // are fresh (no burned tags), so the count is 0 — no-op by construction.
      if (input.restoreBurnedTags && !didReforge) {
        let restored = 0;
        nextThemes = nextThemes.map((t) => ({
          ...t,
          powerTags: t.powerTags.map((p) => {
            if (p.burned) {
              restored += 1;
              return { ...p, burned: false, scratched: false };
            }
            return p;
          }),
        })) as Character["themes"];
        entry.burnedTagsRestored = restored;
      }

      const updatedProgression: Character["progression"] = {
        promise: 0,
        quintessences: nextQuintessences,
        momentsOfFulfillment: [
          ...character.progression.momentsOfFulfillment,
          entry,
        ],
      };

      tx.update(snap.ref, {
        themes: nextThemes,
        statuses: nextStatuses,
        backpack: nextBackpack,
        identity: nextIdentity,
        progression: updatedProgression,
        status: nextStatus,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const logCampaignId = character.campaignIds[0] ?? null;
      if (logCampaignId) {
        writeLogEntry(tx, {
          campaignId: logCampaignId,
          authorUid: ctx.uid,
          authorName: getAuthorDisplayName(ctx),
          subjectCharacterId: input.characterId,
          subjectCharacterName: nextIdentity.name,
          text: summarizeMomentOfFulfillment(
            nextIdentity.name || "A hero",
            choice.kind,
            entry.burnedTagsRestored,
          ),
          details: {
            kind: "momentOfFulfillment",
            chosenPath: choice.kind,
            burnedTagsRestored: entry.burnedTagsRestored,
          },
        });
      } else {
        // eslint-disable-next-line no-console
        console.debug(
          "[session-log] MoF resolution outside campaign — no log entry emitted",
        );
      }

      return {
        path: choice.kind,
        burnedTagsRestored: entry.burnedTagsRestored,
        entryId: entry.id,
        summaryMessage: buildSummaryMessage(
          {
            kind: choice.kind,
            text: choice.kind === "gainQuintessence" ? choice.text : undefined,
          },
          entry.burnedTagsRestored,
        ),
      };
    });
  },
);
