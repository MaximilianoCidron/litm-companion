import "server-only";
import type {
  DocumentSnapshot,
  DocumentData,
  Transaction,
} from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError } from "@/shared/auth";

export type CharacterAccessRole = "owner" | "gm";

export interface CharacterAccess {
  role: CharacterAccessRole;
  snap: DocumentSnapshot<DocumentData>;
}

/**
 * Authorize a character read/write and return the doc snapshot.
 * Owner: doc.userId === uid.
 * GM: any of doc.campaignIds appears in users/{uid}.gmCampaignIds.
 *
 * Mirrors firestore.rules logic. Server is the primary gate; rules are the
 * backstop. Caller can pass a Transaction to read inside it; without one,
 * uses a plain ref.get().
 */
export async function requireCharacterAccess(
  characterId: string,
  uid: string,
  tx?: Transaction,
): Promise<CharacterAccess> {
  const db = getAdminDb();
  const ref = db.collection("characters").doc(characterId);
  const snap = tx ? await tx.get(ref) : await ref.get();
  if (!snap.exists) {
    throw new ActionError("NOT_FOUND", "Character not found.");
  }
  const data = snap.data() ?? {};

  if (data.userId === uid) {
    return { role: "owner", snap };
  }

  const campaignIds: string[] = Array.isArray(data.campaignIds)
    ? data.campaignIds
    : [];
  if (campaignIds.length > 0) {
    const userRef = db.collection("users").doc(uid);
    const userSnap = tx ? await tx.get(userRef) : await userRef.get();
    const gmCampaignIds: string[] = userSnap.exists
      ? ((userSnap.data()?.gmCampaignIds as string[] | undefined) ?? [])
      : [];
    if (gmCampaignIds.some((cid) => campaignIds.includes(cid))) {
      return { role: "gm", snap };
    }
  }

  throw new ActionError(
    "FORBIDDEN",
    "You do not have access to this character.",
  );
}
