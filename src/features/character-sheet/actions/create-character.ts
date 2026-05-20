"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { withAction } from "@/shared/auth";
import { CharacterSchema, CreateCharacterInput } from "../schemas";
import { buildBlankCharacter } from "../lib/character-factory";

const NOW_SENTINEL = "1970-01-01T00:00:00.000Z";

export const createCharacter = withAction(
  CreateCharacterInput,
  async (input, ctx) => {
    const db = getAdminDb();
    const docRef = db.collection("characters").doc();

    const blank = buildBlankCharacter({
      id: docRef.id,
      userId: ctx.uid,
      name: input.name,
      concept: input.concept,
      campaignIds: input.campaignId ? [input.campaignId] : [],
    });

    // Round-trip through Zod to surface any drift before we write.
    // createdAt/updatedAt are placeholders here — actual values come from
    // FieldValue.serverTimestamp() at write time.
    CharacterSchema.parse({
      ...blank,
      createdAt: NOW_SENTINEL,
      updatedAt: NOW_SENTINEL,
    });

    const batch = db.batch();
    batch.set(docRef, {
      ...blank,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    if (input.campaignId) {
      const campaignRef = db.collection("campaigns").doc(input.campaignId);
      batch.update(campaignRef, {
        characterIds: FieldValue.arrayUnion(docRef.id),
        roster: FieldValue.arrayUnion({
          charId: docRef.id,
          name: input.name,
          avatarUrl: null,
          concept: input.concept ?? "",
        }),
      });
    }

    await batch.commit();
    return { id: docRef.id };
  },
);
