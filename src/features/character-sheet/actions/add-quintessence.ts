"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  AddQuintessenceInput,
  QuintessenceId,
  type Quintessence,
} from "../schemas";
import { requireCharacterOwnership } from "../lib/access";
import { firestoreToCharacter } from "../lib/serialize";

/**
 * Internal: invoked by the gainQuintessence MoF path AND testable on its
 * own. Not exposed via UI in v1 — no manual quintessence-add affordance.
 * Production MoF inlines the equivalent logic so the whole resolution is
 * a single transaction; this action exists for future GM-side admin and
 * for unit testing of the quintessence-append rule.
 */
export const addQuintessence = withAction(
  AddQuintessenceInput,
  async (input, ctx): Promise<{ quintessenceId: string }> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      const { snap } = await requireCharacterOwnership(
        input.characterId,
        ctx.uid,
        tx,
      );
      const character = firestoreToCharacter(snap);

      if (character.quintessences.length >= 20) {
        throw new ActionError(
          "INVALID_STATE",
          "Quintessence list is at the limit.",
        );
      }

      const newQuintessence: Quintessence = {
        id: QuintessenceId.parse(crypto.randomUUID()),
        name: input.name,
        scratched: false,
        sourceMoFEntryId: input.sourceMoFEntryId,
        createdAt: new Date().toISOString(),
      };

      tx.update(snap.ref, {
        quintessences: [...character.quintessences, newQuintessence],
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { quintessenceId: newQuintessence.id };
    });
  },
);
