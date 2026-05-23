"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  ResolvePendingThreatInput,
  StatusId,
  type PendingThreatResolution,
  type Status,
} from "../schemas";
import {
  firestoreToCharacter,
  firestoreToPendingThreat,
} from "../lib/serialize";
import {
  getAuthorDisplayName,
  summarizeReactionResolution,
  writeLogEntry,
} from "../lib/session-log";

const STATUS_LIMIT = 20;

interface ResolvePendingThreatResult {
  pendingThreatId: string;
  resolution: PendingThreatResolution;
}

// NOTE: applies the resolved consequence inline rather than calling
// applyStatus / updateTag — same atomicity rationale as deliverThreat
// (prompt 11). Keep these branches in sync if upstream actions change
// their write shape.

export const resolvePendingThreat = withAction(
  ResolvePendingThreatInput,
  async (input, ctx): Promise<ResolvePendingThreatResult> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      const ptRef = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("pendingThreats")
        .doc(input.pendingThreatId);
      const ptSnap = await tx.get(ptRef);
      if (!ptSnap.exists) {
        throw new ActionError("NOT_FOUND", "Pending threat not found.");
      }
      const pt = firestoreToPendingThreat(ptSnap);

      // Authorize: target player OR campaign GM.
      const campRef = db.collection("campaigns").doc(input.campaignId);
      const campSnap = await tx.get(campRef);
      if (!campSnap.exists) {
        throw new ActionError("NOT_FOUND", "Campaign not found.");
      }
      const gmUid = (campSnap.data()?.gmUid as string | undefined) ?? "";
      const isTarget = ctx.uid === pt.targetUid;
      const isGm = ctx.uid === gmUid;
      if (!isTarget && !isGm) {
        throw new ActionError(
          "FORBIDDEN",
          "Only the targeted player or the GM can resolve this threat.",
        );
      }

      if (pt.status === "resolved" || pt.status === "canceled") {
        throw new ActionError(
          "INVALID_STATE",
          "This threat is no longer pending.",
        );
      }

      const cons = pt.consequence;
      const reduction = input.reduction;

      // Validate reduction kind matches consequence kind.
      if (
        reduction.kind === "tierReduction" &&
        cons.kind !== "applyStatus"
      ) {
        throw new ActionError(
          "VALIDATION",
          "Tier reduction only applies to status consequences.",
        );
      }
      if (
        reduction.kind === "tagPreservation" &&
        cons.kind !== "scratchTag"
      ) {
        throw new ActionError(
          "VALIDATION",
          "Tag preservation only applies to scratch consequences.",
        );
      }

      // Validate Power affordability.
      if (reduction.kind === "tierReduction") {
        if (pt.status !== "reactionRolled" || pt.reactionPower === null) {
          throw new ActionError(
            "INVALID_STATE",
            "Roll your Reaction before spending Power.",
          );
        }
        if (reduction.powerSpent > pt.reactionPower) {
          throw new ActionError(
            "INVALID_STATE",
            "Not enough Power to spend that many tiers.",
          );
        }
      }
      if (reduction.kind === "tagPreservation" && reduction.preserve) {
        if (pt.status !== "reactionRolled" || pt.reactionPower === null) {
          throw new ActionError(
            "INVALID_STATE",
            "Roll your Reaction before spending Power.",
          );
        }
        if (pt.reactionPower < 2) {
          throw new ActionError(
            "INVALID_STATE",
            "Tag preservation costs 2 Power.",
          );
        }
      }

      // Read target character (also needed to apply).
      const charRef = db.collection("characters").doc(pt.targetCharacterId);
      const charSnap = await tx.get(charRef);
      if (!charSnap.exists) {
        throw new ActionError("NOT_FOUND", "Target hero not found.");
      }
      const character = firestoreToCharacter(charSnap);

      // Compute resolution + apply.
      let resolution: PendingThreatResolution;
      let logSummary: string;

      if (cons.kind === "applyStatus") {
        const originalTier = cons.tier;
        let finalTier = originalTier;
        let powerSpent = 0;
        if (reduction.kind === "tierReduction") {
          powerSpent = reduction.powerSpent;
          finalTier = Math.max(0, originalTier - powerSpent);
          resolution = {
            kind: "tierReduction",
            powerSpent,
            tiersReduced: powerSpent,
            finalTier,
          };
        } else if (reduction.kind === "none") {
          resolution = { kind: "acceptedFull" };
        } else {
          throw new ActionError(
            "VALIDATION",
            "Unsupported reduction kind for status consequence.",
          );
        }

        if (finalTier > 0) {
          if (character.statuses.length >= STATUS_LIMIT) {
            throw new ActionError(
              "INVALID_STATE",
              "That hero has too many active statuses; clear one first.",
            );
          }
          const status: Status = {
            id: StatusId.parse(crypto.randomUUID()),
            name: cons.statusName,
            tier: finalTier as Status["tier"],
            polarity: cons.polarity,
          };
          tx.update(charRef, {
            statuses: [...character.statuses, status],
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
        logSummary = summarizeReactionResolution({
          targetName: character.identity.name || "A hero",
          consequenceKind: "applyStatus",
          statusName: cons.statusName,
          originalTier,
          finalTier,
          polarity: cons.polarity,
          outcome:
            resolution.kind === "acceptedFull"
              ? "acceptedFull"
              : "tierReduction",
          powerSpent,
        });
      } else {
        // scratchTag
        let preserved = false;
        if (reduction.kind === "tagPreservation" && reduction.preserve) {
          preserved = true;
          resolution = { kind: "tagPreserved", powerSpent: 2 };
        } else {
          resolution = { kind: "tagScratched" };
        }

        if (!preserved) {
          // Apply scratch — same inline logic as deliver-threat.
          const loc = cons.location;
          if (loc.kind === "theme") {
            const themeIdx = character.themes.findIndex(
              (t) => t.id === loc.themeId,
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
            const tagIdx = theme.powerTags.findIndex((p) => p.id === cons.tagId);
            if (tagIdx < 0) {
              throw new ActionError(
                "NOT_FOUND",
                "Power tag not found on theme.",
              );
            }
            const tag = theme.powerTags[tagIdx]!;
            if (!tag.scratched && !tag.burned) {
              theme.powerTags[tagIdx] = { ...tag, scratched: true };
              tx.update(charRef, {
                themes: updatedThemes,
                updatedAt: FieldValue.serverTimestamp(),
              });
            }
          } else if (loc.kind === "backpack") {
            const storyTags = character.backpack.storyTags.map((s) => ({
              ...s,
            }));
            const idx = storyTags.findIndex((s) => s.id === cons.tagId);
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
          } else {
            throw new ActionError(
              "INVALID_STATE",
              "Fellowship and relationship tags cannot be scratched here.",
            );
          }
        }

        logSummary = summarizeReactionResolution({
          targetName: character.identity.name || "A hero",
          consequenceKind: "scratchTag",
          tagName: cons.tagName,
          outcome: preserved ? "tagPreserved" : "tagScratched",
          powerSpent: preserved ? 2 : undefined,
        });
      }

      tx.update(ptRef, {
        status: "resolved",
        resolution,
        resolvedAt: FieldValue.serverTimestamp(),
      });

      // Session log entry.
      writeLogEntry(tx, {
        campaignId: input.campaignId,
        authorUid: ctx.uid,
        authorName: getAuthorDisplayName(ctx),
        subjectCharacterId: pt.targetCharacterId,
        subjectCharacterName: pt.targetCharacterName,
        text: logSummary,
        details: {
          kind: "deliverThreat",
          challengeId: pt.challengeId,
          consequenceKind: cons.kind,
          consequenceSummary: logSummary,
        },
      });

      return {
        pendingThreatId: input.pendingThreatId,
        resolution,
      };
    });
  },
);
