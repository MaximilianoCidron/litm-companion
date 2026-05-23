"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { withAction } from "@/shared/auth";
import { UpdateBackpackNotesInput } from "../schemas";
import { assertNotRetired, requireCharacterAccess } from "../lib/access";

export const updateBackpackNotes = withAction(
  UpdateBackpackNotesInput,
  async (input, ctx): Promise<{ updated: true }> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );
      assertNotRetired(access.snap.data() ?? {}); // retired-character guard

      tx.update(access.snap.ref, {
        "backpack.notes": input.notes,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { updated: true as const };
    });
  },
);
