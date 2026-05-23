import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import type { Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import type { Challenge } from "../schemas";

/**
 * Upsert or delete the public engaged-challenge mirror based on the
 * post-mutation challenge state. Callers compute the updated challenge
 * in memory, then call this helper inside the same transaction.
 *
 * Mirror exposes ONLY the player-visible subset: id, campaignId, name, tags.
 * Statuses, limits, threats, notes, and the `engaged` flag stay on the
 * GM-only source doc.
 */
export function syncEngagedMirror(
  tx: Transaction,
  challenge: Challenge,
): void {
  const db = getAdminDb();
  const mirrorRef = db
    .collection("campaigns")
    .doc(challenge.campaignId)
    .collection("engagedChallenges")
    .doc(challenge.id);

  if (challenge.engaged) {
    tx.set(mirrorRef, {
      id: challenge.id,
      campaignId: challenge.campaignId,
      name: challenge.name,
      tags: challenge.tags,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } else {
    // tx.delete on a missing doc is a no-op — safe to call unconditionally
    // when disengaging.
    tx.delete(mirrorRef);
  }
}
