"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/shared/firebase/admin";
import { withAction } from "@/shared/auth";
import { RemoveCharacterAvatarInput } from "../schemas";
import { requireCharacterOwnership } from "../lib/access";

export const removeCharacterAvatar = withAction(
  RemoveCharacterAvatarInput,
  async (input, ctx): Promise<{ ok: true }> => {
    const db = getAdminDb();
    await db.runTransaction(async (tx) => {
      const { snap } = await requireCharacterOwnership(
        input.characterId,
        ctx.uid,
        tx,
      );
      tx.update(snap.ref, {
        avatar: null,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    // Best-effort Storage cleanup outside the transaction. Storage ops are
    // not transactional with Firestore; orphans are harmless.
    const bucket = getAdminStorage().bucket();
    const base = `users/${ctx.uid}/characters/${input.characterId}`;
    await Promise.all([
      bucket
        .file(`${base}/avatar.jpg`)
        .delete()
        .catch(() => {}),
      bucket
        .file(`${base}/avatar-thumb.jpg`)
        .delete()
        .catch(() => {}),
    ]);

    return { ok: true };
  },
);
