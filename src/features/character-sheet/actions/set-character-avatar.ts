"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { SetCharacterAvatarInput } from "../schemas";
import { requireCharacterOwnership } from "../lib/access";

const FIREBASE_STORAGE_PREFIX = "https://firebasestorage.googleapis.com/";

export const setCharacterAvatar = withAction(
  SetCharacterAvatarInput,
  async (input, ctx): Promise<{ ok: true }> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      const { snap } = await requireCharacterOwnership(
        input.characterId,
        ctx.uid,
        tx,
      );

      // Defense-in-depth: only persist URLs pointing at Firebase Storage
      // AND specifically at this owner+character's folder. AuthSyncGuard
      // keeps the client SDK uid aligned with the session uid, so ctx.uid
      // here equals the path's userId at upload time.
      const expectedPath = `users%2F${ctx.uid}%2Fcharacters%2F${input.characterId}%2F`;
      for (const url of [input.mainUrl, input.thumbUrl]) {
        if (!url.startsWith(FIREBASE_STORAGE_PREFIX)) {
          throw new ActionError(
            "VALIDATION",
            "Avatar URL must be a Firebase Storage URL.",
          );
        }
        if (!url.includes(expectedPath)) {
          throw new ActionError(
            "VALIDATION",
            "Avatar URL doesn't match this character's path.",
          );
        }
      }

      tx.update(snap.ref, {
        avatar: {
          mainUrl: input.mainUrl,
          thumbUrl: input.thumbUrl,
          updatedAt: new Date().toISOString(),
        },
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { ok: true };
    });
  },
);
