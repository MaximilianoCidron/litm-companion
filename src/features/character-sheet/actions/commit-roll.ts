"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { secureRollD6 } from "@/shared/lib/dice";
import { CommitRollInput, RollId, type Campaign } from "../schemas";
import { requireCharacterAccess } from "../lib/access";
import { firestoreToCampaign, firestoreToCharacter } from "../lib/serialize";
import { computePower, resolveInvocations } from "../lib/power-calc";

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

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );
      const character = firestoreToCharacter(access.snap);

      // Load campaign only when fellowship invocations are present.
      let campaign: Campaign | null = null;
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
        const campRef = db.collection("campaigns").doc(campaignId);
        const campSnap = await tx.get(campRef);
        if (!campSnap.exists) {
          throw new ActionError("NOT_FOUND", "Campaign not found.");
        }
        campaign = firestoreToCampaign(campSnap);
      }

      const resolution = resolveInvocations(
        character,
        campaign,
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
      });

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
