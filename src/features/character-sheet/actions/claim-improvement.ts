"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  ClaimImprovementInput,
  PowerTagSchema,
  TagId,
  type ClaimImprovementInput as ClaimImprovementInputT,
} from "../schemas";
import { assertNotRetired, requireCharacterAccess } from "../lib/access";

interface ClaimImprovementResult {
  themeId: string;
  kind: ClaimImprovementInputT["choice"]["kind"];
}

const POWER_TAG_LIMIT = 12;
const IMPROVEMENT_LIMIT = 12;

export const claimImprovement = withAction(
  ClaimImprovementInput,
  async (input, ctx): Promise<ClaimImprovementResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );

      const data = access.snap.data() ?? {};
      assertNotRetired(data); // retired-character guard
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
      const tracks = { ...(theme.tracks as Record<string, number> | undefined) };

      if ((tracks.improve ?? 0) !== 3) {
        throw new ActionError(
          "INVALID_STATE",
          "Improve track is not complete.",
        );
      }

      if (input.choice.kind === "addTag") {
        const powerTags = Array.isArray(theme.powerTags)
          ? [...(theme.powerTags as Record<string, unknown>[])]
          : [];
        if (powerTags.length >= POWER_TAG_LIMIT) {
          throw new ActionError(
            "INVALID_STATE",
            "Theme is at the tag limit.",
          );
        }
        const newTag = PowerTagSchema.parse({
          id: TagId.parse(crypto.randomUUID()),
          name: input.choice.name,
          scratched: false,
          burned: false,
        });
        powerTags.push(newTag);
        theme.powerTags = powerTags;
      } else if (input.choice.kind === "replaceWeakness") {
        theme.weaknessTag = {
          id: TagId.parse(crypto.randomUUID()),
          name: input.choice.name,
        };
      } else {
        const list: string[] = Array.isArray(theme.specialImprovements)
          ? [...(theme.specialImprovements as string[])]
          : [];
        if (list.length >= IMPROVEMENT_LIMIT) {
          throw new ActionError(
            "INVALID_STATE",
            "Special improvements list is at the limit.",
          );
        }
        list.push(input.choice.text);
        theme.specialImprovements = list;
      }

      tracks.improve = 0;
      theme.tracks = tracks;
      themes[themeIdx] = theme;

      tx.update(access.snap.ref, {
        themes,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { themeId: input.themeId, kind: input.choice.kind };
    });
  },
);
