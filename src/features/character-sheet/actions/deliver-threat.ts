"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  DeliverThreatInput,
  StatusId,
  type ConsequenceTemplate,
  type Status,
} from "../schemas";
import { requireCampaignGm } from "../lib/access";
import {
  firestoreToChallenge,
  firestoreToCharacter,
} from "../lib/serialize";

// NOTE: this action intentionally duplicates the apply logic from
// applyStatus / markTrack / updateTag instead of calling them, to
// preserve a single transaction. Keep these branches in sync if
// the upstream actions change their write shape.

const STATUS_LIMIT = 20;

interface DeliverThreatResult {
  delivered: true;
  consequenceKind: ConsequenceTemplate["kind"];
  target: { characterId: string; characterName: string };
  details: Record<string, unknown>;
}

export const deliverThreat = withAction(
  DeliverThreatInput,
  async (input, ctx): Promise<DeliverThreatResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      await requireCampaignGm(input.campaignId, ctx.uid, tx);

      // Read challenge → locate threat.
      const challengeRef = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("challenges")
        .doc(input.challengeId);
      const challengeSnap = await tx.get(challengeRef);
      if (!challengeSnap.exists) {
        throw new ActionError("NOT_FOUND", "Challenge not found.");
      }
      const challenge = firestoreToChallenge(challengeSnap);
      const threat = challenge.threats.find((t) => t.id === input.threatId);
      if (!threat) {
        throw new ActionError("NOT_FOUND", "Threat not found.");
      }
      const template = threat.consequenceTemplate;

      // Read target character.
      const charRef = db.collection("characters").doc(input.targetCharacterId);
      const charSnap = await tx.get(charRef);
      if (!charSnap.exists) {
        throw new ActionError("NOT_FOUND", "Target hero not found.");
      }
      const character = firestoreToCharacter(charSnap);
      if (!character.campaignIds.includes(input.campaignId)) {
        throw new ActionError(
          "INVALID_STATE",
          "That hero is not in this campaign.",
        );
      }

      const details: Record<string, unknown> = {};

      switch (template.kind) {
        case "applyStatus": {
          if (character.statuses.length >= STATUS_LIMIT) {
            throw new ActionError(
              "INVALID_STATE",
              "That hero has too many active statuses; clear one first.",
            );
          }
          const status: Status = {
            id: StatusId.parse(crypto.randomUUID()),
            name: template.statusName,
            tier: template.tier as Status["tier"],
            polarity: template.polarity,
          };
          tx.update(charRef, {
            statuses: [...character.statuses, status],
            updatedAt: FieldValue.serverTimestamp(),
          });
          details.statusName = template.statusName;
          details.tier = template.tier;
          details.polarity = template.polarity;
          break;
        }
        case "markTrack": {
          if (!input.markTrackTarget) {
            throw new ActionError(
              "VALIDATION",
              "Mark-track threats require a target theme.",
            );
          }
          const { themeId } = input.markTrackTarget;
          const themeIdx = character.themes.findIndex((t) => t.id === themeId);
          if (themeIdx < 0) {
            throw new ActionError("NOT_FOUND", "Theme not found on hero.");
          }
          const updatedThemes = character.themes.map((t) => ({
            ...t,
            tracks: { ...t.tracks },
          })) as typeof character.themes;
          const theme = updatedThemes[themeIdx]!;
          const before = theme.tracks[template.track];
          const after = Math.max(0, Math.min(3, before + template.delta));
          theme.tracks[template.track] = after;
          tx.update(charRef, {
            themes: updatedThemes,
            updatedAt: FieldValue.serverTimestamp(),
          });
          details.themeId = themeId;
          details.themeName = theme.name;
          details.track = template.track;
          details.delta = template.delta;
          details.before = before;
          details.after = after;
          break;
        }
        case "scratchTag": {
          if (!input.scratchTarget) {
            throw new ActionError(
              "VALIDATION",
              "Scratch-tag threats require a target tag.",
            );
          }
          const { location, tagId } = input.scratchTarget;
          let scratchedName = "";

          if (location.kind === "theme") {
            const themeIdx = character.themes.findIndex(
              (t) => t.id === location.themeId,
            );
            if (themeIdx < 0) {
              throw new ActionError("NOT_FOUND", "Theme not found on hero.");
            }
            const updatedThemes = character.themes.map((t) => ({
              ...t,
              powerTags: t.powerTags.map((p) => ({ ...p })),
              tracks: { ...t.tracks },
            })) as typeof character.themes;
            const theme = updatedThemes[themeIdx]!;
            const tagIdx = theme.powerTags.findIndex((p) => p.id === tagId);
            if (tagIdx < 0) {
              throw new ActionError(
                "NOT_FOUND",
                "Power tag not found on theme.",
              );
            }
            const tag = theme.powerTags[tagIdx]!;
            // Idempotent: already scratched or burned → no-op write.
            if (!tag.scratched && !tag.burned) {
              theme.powerTags[tagIdx] = { ...tag, scratched: true };
              tx.update(charRef, {
                themes: updatedThemes,
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
            scratchedName = tag.name;
          } else if (location.kind === "backpack") {
            const storyTags = character.backpack.storyTags.map((s) => ({
              ...s,
            }));
            const idx = storyTags.findIndex((s) => s.id === tagId);
            if (idx < 0) {
              throw new ActionError("NOT_FOUND", "Story tag not found.");
            }
            const tag = storyTags[idx]!;
            if (!tag.scratched) {
              storyTags[idx] = { ...tag, scratched: true };
              tx.update(charRef, {
                "backpack.storyTags": storyTags,
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
            scratchedName = tag.name;
          } else {
            throw new ActionError(
              "INVALID_STATE",
              "Fellowship and relationship tags cannot be scratched by threats.",
            );
          }

          details.tagName = scratchedName;
          break;
        }
        case "custom": {
          // No mechanical write — UI toasts the description.
          details.description = template.description;
          break;
        }
      }

      // Bump challenge updatedAt so the list re-orders.
      tx.update(challengeRef, {
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        delivered: true,
        consequenceKind: template.kind,
        target: {
          characterId: input.targetCharacterId,
          characterName: character.identity.name,
        },
        details,
      };
    });
  },
);
