"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  AllocateLimitProgressInput,
  type ChallengeLimit,
} from "../schemas";
import {
  firestoreToCampaign,
  firestoreToChallenge,
  firestoreToCharacter,
  firestoreToRollRecord,
} from "../lib/serialize";
import { syncEngagedMirror } from "../lib/engaged-challenge-sync";
import {
  activeSessionIdFrom,
  getAuthorDisplayName,
  writeLogEntry,
} from "../lib/session-log";

interface AppliedAllocation {
  limitId: string;
  limitLabel: string;
  powerSpent: number;
  newCurrent: number;
  overcame: boolean;
}

interface AllocateResult {
  rollId: string;
  applied: true;
  allocations: AppliedAllocation[];
}

export const allocateLimitProgress = withAction(
  AllocateLimitProgressInput,
  async (input, ctx): Promise<AllocateResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      // Read phase
      const rollRef = db
        .collection("characters")
        .doc(input.characterId)
        .collection("rolls")
        .doc(input.rollId);
      const rollSnap = await tx.get(rollRef);
      if (!rollSnap.exists) {
        throw new ActionError("NOT_FOUND", "Roll not found.");
      }
      const roll = firestoreToRollRecord(rollSnap);

      const charRef = db.collection("characters").doc(input.characterId);
      const charSnap = await tx.get(charRef);
      if (!charSnap.exists) {
        throw new ActionError("NOT_FOUND", "Character not found.");
      }
      const character = firestoreToCharacter(charSnap);

      const campaignRef = db.collection("campaigns").doc(input.campaignId);
      const campaignSnap = await tx.get(campaignRef);
      if (!campaignSnap.exists) {
        throw new ActionError("NOT_FOUND", "Campaign not found.");
      }
      const campaign = firestoreToCampaign(campaignSnap);

      const isOwner = character.userId === ctx.uid;
      const isGm = campaign.gmUid === ctx.uid;
      if (!isOwner && !isGm) {
        throw new ActionError(
          "FORBIDDEN",
          "Only the roll's owner or campaign GM can allocate.",
        );
      }

      if (!roll.isDetailedAction || !roll.detailedActionTarget) {
        throw new ActionError(
          "INVALID_STATE",
          "This roll wasn't marked as a Detailed action.",
        );
      }
      if (roll.detailedActionTarget.challengeId !== input.challengeId) {
        throw new ActionError(
          "VALIDATION",
          "Allocation challenge doesn't match the roll's target.",
        );
      }
      if (roll.detailedActionTarget.campaignId !== input.campaignId) {
        throw new ActionError(
          "VALIDATION",
          "Allocation campaign doesn't match the roll's target.",
        );
      }
      if (roll.limitAllocationApplied) {
        throw new ActionError(
          "INVALID_STATE",
          "Allocation already applied for this roll.",
        );
      }

      const totalRequested = input.allocations.reduce(
        (sum, a) => sum + a.powerSpent,
        0,
      );
      if (totalRequested > roll.power) {
        throw new ActionError(
          "VALIDATION",
          `Allocation total (${totalRequested}) exceeds rolled Power (${roll.power}).`,
        );
      }

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
      if (!challenge.engaged || !challenge.exposeLimits) {
        throw new ActionError(
          "INVALID_STATE",
          "Challenge no longer exposes limits.",
        );
      }

      // Apply allocations: clamp at threshold; an already-maxed limit is a
      // silent no-op.
      const limitsCopy: ChallengeLimit[] = challenge.limits.map((l) => ({
        ...l,
      }));
      const applied: AppliedAllocation[] = [];
      const logEntries: Array<{
        limit: ChallengeLimit;
        previousCurrent: number;
        newCurrent: number;
        powerSpent: number;
      }> = [];

      for (const alloc of input.allocations) {
        const idx = limitsCopy.findIndex((l) => l.id === alloc.limitId);
        if (idx < 0) {
          throw new ActionError("NOT_FOUND", "Limit not found.");
        }
        const limit = limitsCopy[idx]!;
        const previousCurrent = limit.current;
        const newCurrent = Math.min(
          limit.current + alloc.powerSpent,
          limit.threshold,
        );
        const effectiveSpend = newCurrent - previousCurrent;
        if (effectiveSpend <= 0) continue;
        limitsCopy[idx] = { ...limit, current: newCurrent };
        const overcame = newCurrent >= limit.threshold;
        logEntries.push({
          limit,
          previousCurrent,
          newCurrent,
          powerSpent: effectiveSpend,
        });
        applied.push({
          limitId: limit.id,
          limitLabel: limit.label,
          powerSpent: effectiveSpend,
          newCurrent,
          overcame,
        });
      }

      // Write phase
      const updatedChallenge = { ...challenge, limits: limitsCopy };
      tx.update(challengeRef, {
        limits: limitsCopy,
        updatedAt: FieldValue.serverTimestamp(),
      });
      syncEngagedMirror(tx, updatedChallenge);

      tx.update(rollRef, { limitAllocationApplied: true });

      const sessionId = activeSessionIdFrom(
        campaign as unknown as Record<string, unknown>,
      );
      const authorName = getAuthorDisplayName(ctx);
      for (const entry of logEntries) {
        const overcame = entry.newCurrent >= entry.limit.threshold;
        const text = overcame
          ? `${character.identity.name} overcame "${entry.limit.label}" on ${challenge.name} (spent ${entry.powerSpent} Power).`
          : `${character.identity.name} advanced "${entry.limit.label}" on ${challenge.name} by ${entry.powerSpent} Power (${entry.newCurrent}/${entry.limit.threshold}).`;
        writeLogEntry(tx, {
          campaignId: input.campaignId,
          authorUid: ctx.uid,
          authorName,
          subjectCharacterId: input.characterId,
          subjectCharacterName: character.identity.name,
          text,
          details: {
            kind: "limitAdvancement",
            challengeId: challenge.id,
            challengeName: challenge.name,
            limitId: entry.limit.id,
            limitLabel: entry.limit.label,
            powerSpent: entry.powerSpent,
            previousCurrent: entry.previousCurrent,
            newCurrent: entry.newCurrent,
            threshold: entry.limit.threshold,
            overcame,
          },
          sessionId,
        });
      }

      return {
        rollId: input.rollId,
        applied: true,
        allocations: applied,
      };
    });
  },
);
