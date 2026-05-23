"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { MutateSpecialImprovementsInput } from "../schemas";
import { assertNotRetired, requireCharacterAccess } from "../lib/access";

const LIMIT = 12;

export const mutateSpecialImprovements = withAction(
  MutateSpecialImprovementsInput,
  async (input, ctx): Promise<{ themeId: string; op: "add" | "remove" | "edit" }> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );

      const data = access.snap.data() ?? {};
      assertNotRetired(data); // retired-character guard
      const themes = Array.isArray(data.themes) ? [...data.themes] : [];
      const themeIdx = themes.findIndex(
        (t: { id: string }) => t.id === input.themeId,
      );
      if (themeIdx === -1) {
        throw new ActionError("NOT_FOUND", "Theme not found on character.");
      }
      const theme = { ...themes[themeIdx] };
      const list: string[] = Array.isArray(theme.specialImprovements)
        ? [...theme.specialImprovements]
        : [];

      if (input.op.kind === "add") {
        if (list.length >= LIMIT) {
          throw new ActionError(
            "INVALID_STATE",
            "Special improvements list is at the limit.",
          );
        }
        list.push(input.op.text);
      } else if (input.op.kind === "remove") {
        if (input.op.index >= list.length) {
          throw new ActionError("NOT_FOUND", "Improvement index out of range.");
        }
        list.splice(input.op.index, 1);
      } else {
        if (input.op.index >= list.length) {
          throw new ActionError("NOT_FOUND", "Improvement index out of range.");
        }
        list[input.op.index] = input.op.text;
      }

      theme.specialImprovements = list;
      themes[themeIdx] = theme;

      tx.update(access.snap.ref, {
        themes,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { themeId: input.themeId, op: input.op.kind };
    });
  },
);
