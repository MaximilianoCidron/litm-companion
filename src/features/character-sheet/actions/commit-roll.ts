"use server";
import { FieldValue } from "firebase-admin/firestore";
import type { DocumentReference } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { secureRollD6 } from "@/shared/lib/dice";
import {
  CommitRollInput,
  RollId,
  type Campaign,
  type CampaignId,
  type EngagedChallenge,
} from "../schemas";
import { assertNotRetired, requireCharacterAccess } from "../lib/access";
import {
  activeSessionIdFrom,
  resolveActiveSessionId,
} from "../lib/session-log";
import {
  firestoreToCampaign,
  firestoreToChallenge,
  firestoreToCharacter,
  firestoreToEngagedChallenge,
} from "../lib/serialize";
import { computePower, resolveInvocations } from "../lib/power-calc";
import { syncEngagedMirror } from "../lib/engaged-challenge-sync";

interface CommitRollResult {
  rollId: string;
  d1: number;
  d2: number;
  power: number;
  total: number;
  tier: "success" | "mixed" | "failure" | null;
  improveMarksApplied: number;
  tagsBurned: number;
  storyTagsScratched: number;
}

export const commitRoll = withAction(
  CommitRollInput,
  async (input, ctx): Promise<CommitRollResult> => {
    const db = getAdminDb();

    // Detailed action / Reaction mutual exclusion + paired-field invariants.
    // Enforced here because Zod can't express conditional requiredness across
    // discriminated booleans without a discriminator.
    if (input.isDetailedAction && input.isReaction) {
      throw new ActionError(
        "VALIDATION",
        "A roll can't be both a Detailed action and a Reaction.",
      );
    }
    if (input.isDetailedAction && !input.detailedActionTarget) {
      throw new ActionError(
        "VALIDATION",
        "Detailed action requires a target challenge.",
      );
    }
    if (!input.isDetailedAction && input.detailedActionTarget) {
      throw new ActionError(
        "VALIDATION",
        "detailedActionTarget set but isDetailedAction is false.",
      );
    }

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );
      assertNotRetired(access.snap.data() ?? {}); // retired-character guard
      const character = firestoreToCharacter(access.snap);

      // Load campaign only when fellowship invocations are present.
      let campaign: Campaign | null = null;
      let campRef: DocumentReference | null = null;
      const fellowshipInv = input.invocations.tags.find(
        (t) => t.location.kind === "fellowship",
      );
      if (fellowshipInv && fellowshipInv.location.kind === "fellowship") {
        const campaignId = fellowshipInv.location.campaignId;
        if (!character.campaignIds.includes(campaignId)) {
          throw new ActionError(
            "FORBIDDEN",
            "Character is not in that fellowship.",
          );
        }
        campRef = db.collection("campaigns").doc(campaignId);
        const campSnap = await tx.get(campRef);
        if (!campSnap.exists) {
          throw new ActionError("NOT_FOUND", "Campaign not found.");
        }
        campaign = firestoreToCampaign(campSnap);
      }

      // Resolve active session for sessionId tagging. Reuse the campaign
      // snapshot when already loaded (fellowship invocation path), otherwise
      // call resolveActiveSessionId for the primary campaign in the read
      // phase. Rolls outside any campaign stay sessionId:null.
      const primaryCampaignId = character.campaignIds[0] ?? null;
      let sessionIdForRoll: string | null = null;
      if (campaign) {
        sessionIdForRoll = activeSessionIdFrom(
          campaign as unknown as Record<string, unknown>,
        );
      } else if (primaryCampaignId) {
        sessionIdForRoll = await resolveActiveSessionId(tx, primaryCampaignId);
      }

      // Load engaged-challenge mirrors AND source docs for any challenge
      // invocations. Firestore transactions require all reads before writes,
      // so we batch both up front. Sources are needed later for scratching
      // (the mirror is denormalized; the source is authoritative).
      // Union challenge ids from BOTH tag and status invocations. Tag
      // invocations may scratch the source; status invocations don't, but
      // the mirror is still needed so power-calc can resolve status tiers.
      const challengeIdLocations = new Map<string, CampaignId>(); // cid -> campaignId
      for (const inv of input.invocations.tags) {
        if (inv.location.kind === "challenge") {
          challengeIdLocations.set(
            inv.location.challengeId,
            inv.location.campaignId,
          );
        }
      }
      for (const inv of input.invocations.statuses) {
        if (inv.location.kind === "challenge") {
          challengeIdLocations.set(
            inv.location.challengeId,
            inv.location.campaignId,
          );
        }
      }
      // Detailed action target also needs its engaged mirror loaded so we
      // can snapshot the name AND verify the challenge still exposes limits.
      if (input.isDetailedAction && input.detailedActionTarget) {
        challengeIdLocations.set(
          input.detailedActionTarget.challengeId,
          input.detailedActionTarget.campaignId,
        );
      }
      const engagedChallenges = new Map<string, EngagedChallenge>();
      const challengeSources = new Map<
        string,
        { ref: DocumentReference; campaignId: string }
      >();
      for (const [challengeId, campaignIdLoc] of challengeIdLocations) {
        if (!character.campaignIds.includes(campaignIdLoc)) {
          throw new ActionError(
            "FORBIDDEN",
            "Character is not in that challenge's campaign.",
          );
        }
        const mirrorRef = db
          .collection("campaigns")
          .doc(campaignIdLoc)
          .collection("engagedChallenges")
          .doc(challengeId);
        const sourceRef = db
          .collection("campaigns")
          .doc(campaignIdLoc)
          .collection("challenges")
          .doc(challengeId);
        const mirrorSnap = await tx.get(mirrorRef);
        if (!mirrorSnap.exists) {
          throw new ActionError(
            "INVALID_STATE",
            "A challenge you invoked is no longer engaged. Clear it and try again.",
          );
        }
        engagedChallenges.set(
          challengeId,
          firestoreToEngagedChallenge(mirrorSnap),
        );
        challengeSources.set(challengeId, {
          ref: sourceRef,
          campaignId: campaignIdLoc,
        });
      }
      // Detailed action target validation + snapshot. The engaged mirror
      // was loaded above (we unioned its challengeId into challengeIdLocations).
      // Verify the target is still engaged AND exposes limits, then capture
      // the challenge name for the roll record.
      let detailedActionTargetSnapshot: {
        campaignId: CampaignId;
        challengeId: import("../schemas").ChallengeId;
        challengeName: string;
      } | null = null;
      if (input.isDetailedAction && input.detailedActionTarget) {
        const engaged = engagedChallenges.get(
          input.detailedActionTarget.challengeId,
        );
        if (!engaged) {
          throw new ActionError(
            "INVALID_STATE",
            "That challenge is no longer engaged.",
          );
        }
        if (engaged.limits.length === 0) {
          throw new ActionError(
            "INVALID_STATE",
            "That challenge no longer exposes limits.",
          );
        }
        detailedActionTargetSnapshot = {
          campaignId: engaged.campaignId,
          challengeId: engaged.id,
          challengeName: engaged.name,
        };
      }

      // Pending-threat link: pre-read in the read phase. If linked the roll
      // MUST be a Reaction AND the caller MUST be the targetUid.
      let pendingThreatRef: DocumentReference | null = null;
      if (input.reactingTo) {
        if (!input.isReaction) {
          throw new ActionError(
            "VALIDATION",
            "reactingTo requires isReaction: true.",
          );
        }
        pendingThreatRef = db
          .collection("campaigns")
          .doc(input.reactingTo.campaignId)
          .collection("pendingThreats")
          .doc(input.reactingTo.pendingThreatId);
        const ptSnap = await tx.get(pendingThreatRef);
        if (!ptSnap.exists) {
          throw new ActionError("NOT_FOUND", "Pending threat not found.");
        }
        const ptStatus = (ptSnap.data()?.status as string | undefined) ?? "";
        if (ptStatus !== "awaitingReaction") {
          throw new ActionError(
            "INVALID_STATE",
            "This pending threat is no longer awaiting a reaction.",
          );
        }
        const ptTargetUid =
          (ptSnap.data()?.targetUid as string | undefined) ?? "";
        if (ptTargetUid !== ctx.uid) {
          throw new ActionError(
            "FORBIDDEN",
            "Only the targeted player can react to this threat.",
          );
        }
      }

      // Pre-fetch source challenges (all reads must precede writes).
      const challengeSourceData = new Map<
        string,
        { challenge: import("../schemas").Challenge; ref: DocumentReference }
      >();
      for (const [challengeId, info] of challengeSources.entries()) {
        const sourceSnap = await tx.get(info.ref);
        if (!sourceSnap.exists) {
          throw new ActionError(
            "NOT_FOUND",
            "Challenge source missing.",
          );
        }
        challengeSourceData.set(challengeId, {
          challenge: firestoreToChallenge(sourceSnap),
          ref: info.ref,
        });
      }

      const resolution = resolveInvocations(
        character,
        campaign,
        engagedChallenges,
        input.invocations,
      );
      if (!resolution.ok) {
        throw new ActionError("INVALID_STATE", resolution.reason);
      }

      const d1 = secureRollD6();
      const d2 = secureRollD6();

      const { total: power } = computePower(
        character,
        campaign,
        engagedChallenges,
        input.invocations,
        input.mightModifier,
      );

      const total = d1 + d2 + power;
      const tier: CommitRollResult["tier"] = input.isReaction
        ? null
        : total >= 10
          ? "success"
          : total >= 7
            ? "mixed"
            : "failure";

      const charRef = db.collection("characters").doc(input.characterId);
      const rollRef = charRef.collection("rolls").doc();
      const rollId = RollId.parse(rollRef.id);

      tx.set(rollRef, {
        id: rollId,
        characterId: input.characterId,
        createdBy: ctx.uid,
        createdAt: FieldValue.serverTimestamp(),
        isReaction: input.isReaction,
        resolved: resolution.resolved,
        mightModifier: input.mightModifier,
        d1,
        d2,
        power,
        total,
        tier,
        reactingTo: input.reactingTo
          ? { pendingThreatId: input.reactingTo.pendingThreatId }
          : null,
        sessionId: sessionIdForRoll,
        isDetailedAction: input.isDetailedAction,
        detailedActionTarget: detailedActionTargetSnapshot,
        limitAllocationApplied: false,
      });

      // Link the roll to the pending threat. Status flips to reactionRolled
      // so the target's banner re-renders with the allocation step.
      if (pendingThreatRef && input.reactingTo) {
        tx.update(pendingThreatRef, {
          status: "reactionRolled",
          reactionRollId: rollRef.id,
          reactionPower: power,
        });
      }

      // Side effects: burn theme power tags, mark Improve for self-invoked
      // weaknesses, scratch single-use story tags.
      const updatedThemes = character.themes.map((t) => ({
        ...t,
        powerTags: t.powerTags.map((p) => ({ ...p })),
        tracks: { ...t.tracks },
      })) as typeof character.themes;
      const updatedStoryTags = character.backpack.storyTags.map((s) => ({
        ...s,
      }));

      let tagsBurned = 0;
      let improveMarksApplied = 0;
      let storyTagsScratched = 0;

      for (const inv of input.invocations.tags) {
        if (inv.location.kind === "theme") {
          const themeId = inv.location.themeId;
          const themeIdx = updatedThemes.findIndex((t) => t.id === themeId);
          if (themeIdx === -1) continue;
          const theme = updatedThemes[themeIdx]!;

          if (inv.burn) {
            const pIdx = theme.powerTags.findIndex((p) => p.id === inv.tagId);
            if (pIdx !== -1) {
              theme.powerTags[pIdx] = {
                ...theme.powerTags[pIdx]!,
                burned: true,
                scratched: true,
              };
              tagsBurned += 1;
            }
          }

          const resolved = resolution.resolved.tags.find(
            (r) => r.tagId === inv.tagId,
          );
          if (resolved?.tagKind === "weakness") {
            theme.tracks.improve = Math.min(3, theme.tracks.improve + 1);
            improveMarksApplied += 1;
          }
          continue;
        }

        if (inv.location.kind === "backpack") {
          const sIdx = updatedStoryTags.findIndex((s) => s.id === inv.tagId);
          if (sIdx === -1) continue;
          const tag = updatedStoryTags[sIdx]!;
          if (tag.isSingleUse && !tag.scratched) {
            updatedStoryTags[sIdx] = { ...tag, scratched: true };
            storyTagsScratched += 1;
          }
        }
      }

      tx.update(charRef, {
        themes: updatedThemes,
        "backpack.storyTags": updatedStoryTags,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Fellowship: scratch each invoked fellowship power tag in the same
      // transaction. Refresh is GM-driven via mutateFellowship({ kind:
      // "refreshTags" }) at party rest. Burning is not a concept on fellowship
      // tags, so we only flip `scratched`.
      if (campRef && campaign) {
        const fellowshipIds = new Set(
          input.invocations.tags
            .filter((t) => t.location.kind === "fellowship")
            .map((t) => t.tagId),
        );
        if (fellowshipIds.size > 0) {
          const updatedFellowshipTags = campaign.fellowship.powerTags.map(
            (tag) =>
              fellowshipIds.has(tag.id) ? { ...tag, scratched: true } : tag,
          );
          tx.update(campRef, {
            fellowship: {
              ...campaign.fellowship,
              powerTags: updatedFellowshipTags,
            },
            updatedAt: FieldValue.serverTimestamp(),
          });
        }
      }

      // Engaged challenges: scratch each invoked challenge TAG on the GM-only
      // source AND re-sync the public mirror. Same transaction. Status
      // invocations don't scratch — they're consumption-free.
      for (const [challengeId, info] of challengeSourceData.entries()) {
        const invokedTagIds = new Set(
          input.invocations.tags
            .filter(
              (t) =>
                t.location.kind === "challenge" &&
                t.location.challengeId === challengeId,
            )
            .map((t) => t.tagId),
        );
        if (invokedTagIds.size === 0) continue;
        const updatedTags = info.challenge.tags.map((tag) =>
          invokedTagIds.has(tag.id) ? { ...tag, scratched: true } : tag,
        );
        const updatedChallenge = { ...info.challenge, tags: updatedTags };
        tx.update(info.ref, {
          tags: updatedTags,
          updatedAt: FieldValue.serverTimestamp(),
        });
        // Mirror is engaged here (we verified its existence above).
        syncEngagedMirror(tx, updatedChallenge);
      }

      return {
        rollId,
        d1,
        d2,
        power,
        total,
        tier,
        improveMarksApplied,
        tagsBurned,
        storyTagsScratched,
      };
    });
  },
);
