"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { RemoveQuintessenceInput } from "../schemas";
import { requireCharacterOwnership } from "../lib/access";
import { firestoreToCharacter } from "../lib/serialize";

/**
 * Defensive cleanup affordance. Not exposed in v1 UI; ownership-gated.
 * Quintessences acquired via MoF are normally permanent — this exists for
 * future admin/correction flows.
 */
export const removeQuintessence = withAction(
  RemoveQuintessenceInput,
  async (input, ctx): Promise<{ ok: true }> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      const { snap } = await requireCharacterOwnership(
        input.characterId,
        ctx.uid,
        tx,
      );
      const character = firestoreToCharacter(snap);

      const filtered = character.quintessences.filter(
        (q) => q.id !== input.quintessenceId,
      );
      if (filtered.length === character.quintessences.length) {
        throw new ActionError("NOT_FOUND", "Quintessence not found.");
      }

      tx.update(snap.ref, {
        quintessences: filtered,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { ok: true };
    });
  },
);
