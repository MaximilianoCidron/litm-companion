"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { BulkCleanupCampaignInput } from "../schemas";
import {
  firestoreToCampaign,
  firestoreToChallenge,
  firestoreToCharacter,
} from "../lib/serialize";
import { syncEngagedMirror } from "../lib/engaged-challenge-sync";
import {
  activeSessionIdFrom,
  getAuthorDisplayName,
  writeLogEntry,
} from "../lib/session-log";

interface BulkCleanupResult {
  affectedCharacterCount: number;
  counts: {
    powerTagsUnscratched: number;
    powerTagsUnburned: number;
    hinderingStatusesCleared: number;
    storyTagsDiscarded: number;
    fellowshipTagsRefreshed: number;
    engagedChallengeTagsRefreshed: number;
  };
}

export const bulkCleanupCampaign = withAction(
  BulkCleanupCampaignInput,
  async (input, ctx): Promise<BulkCleanupResult> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      // Read phase
      const campRef = db.collection("campaigns").doc(input.campaignId);
      const campSnap = await tx.get(campRef);
      if (!campSnap.exists) {
        throw new ActionError("NOT_FOUND", "Campaign not found.");
      }
      const campaign = firestoreToCampaign(campSnap);
      if (campaign.gmUid !== ctx.uid) {
        throw new ActionError(
          "FORBIDDEN",
          "Only the GM can reset the party.",
        );
      }

      const ops = input.operations;

      const characterRefs = campaign.roster.map((r) =>
        db.collection("characters").doc(r.characterId),
      );
      const characterSnaps = await Promise.all(
        characterRefs.map((ref) => tx.get(ref)),
      );

      // Pre-load engaged + source challenges when challenge refresh is on,
      // before any write hits the transaction.
      interface ChallengeLoad {
        ref: FirebaseFirestore.DocumentReference;
        challenge: ReturnType<typeof firestoreToChallenge>;
      }
      const challengeLoads: ChallengeLoad[] = [];
      if (ops.refreshChallengeTags) {
        const engagedColl = await tx.get(
          db
            .collection("campaigns")
            .doc(input.campaignId)
            .collection("engagedChallenges"),
        );
        for (const engagedDoc of engagedColl.docs) {
          const ref = db
            .collection("campaigns")
            .doc(input.campaignId)
            .collection("challenges")
            .doc(engagedDoc.id);
          const sourceSnap = await tx.get(ref);
          if (!sourceSnap.exists) continue;
          try {
            challengeLoads.push({
              ref,
              challenge: firestoreToChallenge(sourceSnap),
            });
          } catch (err) {
            console.warn("[bulk-cleanup] skip challenge", sourceSnap.id, err);
          }
        }
      }

      // Pre-resolve active session for the session-log write later (still in
      // read phase — last read before any write).
      const sessionId = activeSessionIdFrom(
        campSnap.data() as Record<string, unknown> | undefined,
      );

      // Write phase
      let powerTagsUnscratched = 0;
      let powerTagsUnburned = 0;
      let hinderingStatusesCleared = 0;
      let storyTagsDiscarded = 0;
      let affectedCharacterCount = 0;

      for (let i = 0; i < characterSnaps.length; i++) {
        const snap = characterSnaps[i]!;
        if (!snap.exists) continue;
        let character;
        try {
          character = firestoreToCharacter(snap);
        } catch (err) {
          console.warn("[bulk-cleanup] skip malformed character", snap.id, err);
          continue;
        }
        if (character.status === "retired") continue;

        const updates: Record<string, unknown> = {};
        let modified = false;

        if (ops.unscratchPowerTags || ops.unburnPowerTags) {
          const updatedThemes = character.themes.map((theme) => ({
            ...theme,
            powerTags: theme.powerTags.map((tag) => {
              if (ops.unburnPowerTags && tag.burned) {
                powerTagsUnburned += 1;
                return { ...tag, burned: false, scratched: false };
              }
              if (ops.unscratchPowerTags && tag.scratched && !tag.burned) {
                powerTagsUnscratched += 1;
                return { ...tag, scratched: false };
              }
              return tag;
            }),
          }));
          // Only persist themes when something actually changed.
          const themesChanged = updatedThemes.some((t, idx) => {
            const orig = character.themes[idx]!;
            return t.powerTags.some(
              (tag, j) =>
                tag.scratched !== orig.powerTags[j]!.scratched ||
                tag.burned !== orig.powerTags[j]!.burned,
            );
          });
          if (themesChanged) {
            updates.themes = updatedThemes;
            modified = true;
          }
        }

        if (ops.clearHinderingStatuses) {
          const kept = character.statuses.filter(
            (s) => s.polarity === "helpful",
          );
          if (kept.length !== character.statuses.length) {
            hinderingStatusesCleared += character.statuses.length - kept.length;
            updates.statuses = kept;
            modified = true;
          }
        }

        if (ops.discardStoryTags) {
          const kept = character.backpack.storyTags
            .filter((t) => t.preserved === true)
            .map((t) => ({ ...t, scratched: false }));
          const discarded =
            character.backpack.storyTags.length - kept.length;
          if (discarded > 0) {
            storyTagsDiscarded += discarded;
            updates.backpack = { ...character.backpack, storyTags: kept };
            modified = true;
          }
        }

        if (modified) {
          updates.updatedAt = FieldValue.serverTimestamp();
          tx.update(characterRefs[i]!, updates);
          affectedCharacterCount += 1;
        }
      }

      let fellowshipTagsRefreshed = 0;
      if (ops.refreshFellowshipTags) {
        const scratched = campaign.fellowship.powerTags.filter(
          (t) => t.scratched,
        );
        fellowshipTagsRefreshed = scratched.length;
        if (scratched.length > 0) {
          const refreshed = campaign.fellowship.powerTags.map((t) => ({
            ...t,
            scratched: false,
          }));
          tx.update(campRef, {
            fellowship: { ...campaign.fellowship, powerTags: refreshed },
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      let engagedChallengeTagsRefreshed = 0;
      for (const { ref, challenge } of challengeLoads) {
        const scratched = challenge.tags.filter((t) => t.scratched).length;
        if (scratched === 0) continue;
        engagedChallengeTagsRefreshed += scratched;
        const updated = {
          ...challenge,
          tags: challenge.tags.map((t) => ({ ...t, scratched: false })),
        };
        tx.update(ref, {
          tags: updated.tags,
          updatedAt: FieldValue.serverTimestamp(),
        });
        syncEngagedMirror(tx, updated);
      }

      const summaryParts: string[] = [];
      if (powerTagsUnscratched > 0)
        summaryParts.push(
          `${powerTagsUnscratched} power tag${powerTagsUnscratched !== 1 ? "s" : ""} refreshed`,
        );
      if (powerTagsUnburned > 0)
        summaryParts.push(
          `${powerTagsUnburned} burned tag${powerTagsUnburned !== 1 ? "s" : ""} restored`,
        );
      if (hinderingStatusesCleared > 0)
        summaryParts.push(
          `${hinderingStatusesCleared} status${hinderingStatusesCleared !== 1 ? "es" : ""} cleared`,
        );
      if (storyTagsDiscarded > 0)
        summaryParts.push(
          `${storyTagsDiscarded} story tag${storyTagsDiscarded !== 1 ? "s" : ""} discarded`,
        );
      if (fellowshipTagsRefreshed > 0)
        summaryParts.push(`fellowship refreshed`);
      if (engagedChallengeTagsRefreshed > 0)
        summaryParts.push(
          `${engagedChallengeTagsRefreshed} challenge tag${engagedChallengeTagsRefreshed !== 1 ? "s" : ""} refreshed`,
        );

      const text =
        summaryParts.length > 0
          ? `Party reset: ${summaryParts.join(", ")}.`
          : "Party reset (no changes — nothing was eligible).";

      writeLogEntry(tx, {
        campaignId: input.campaignId,
        authorUid: ctx.uid,
        authorName: getAuthorDisplayName(ctx),
        subjectCharacterId: null,
        subjectCharacterName: null,
        text,
        details: {
          kind: "bulkCleanup",
          operations: {
            unscratchPowerTags: ops.unscratchPowerTags,
            clearHinderingStatuses: ops.clearHinderingStatuses,
            discardStoryTags: ops.discardStoryTags,
            unburnPowerTags: ops.unburnPowerTags,
            refreshFellowshipTags: ops.refreshFellowshipTags,
            refreshChallengeTags: ops.refreshChallengeTags,
          },
          counts: {
            affectedCharacterCount,
            powerTagsUnscratched,
            powerTagsUnburned,
            hinderingStatusesCleared,
            storyTagsDiscarded,
            fellowshipTagsRefreshed,
            engagedChallengeTagsRefreshed,
          },
        },
        sessionId,
      });

      return {
        affectedCharacterCount,
        counts: {
          powerTagsUnscratched,
          powerTagsUnburned,
          hinderingStatusesCleared,
          storyTagsDiscarded,
          fellowshipTagsRefreshed,
          engagedChallengeTagsRefreshed,
        },
      };
    });
  },
);
