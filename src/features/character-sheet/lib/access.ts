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

export type CampaignAccessRole = "gm" | "member";

export interface CampaignAccess {
  role: CampaignAccessRole;
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

/**
 * Authorize an OWNER-only character mutation — the player who owns the
 * character. The GM does NOT pass this gate. Use for character-defining
 * operations like Moment-of-Fulfillment resolution where the player must
 * be the sole decision-maker.
 */
export async function requireCharacterOwnership(
  characterId: string,
  uid: string,
  tx?: Transaction,
): Promise<{ snap: DocumentSnapshot<DocumentData> }> {
  const db = getAdminDb();
  const ref = db.collection("characters").doc(characterId);
  const snap = tx ? await tx.get(ref) : await ref.get();
  if (!snap.exists) {
    throw new ActionError("NOT_FOUND", "Character not found.");
  }
  const data = snap.data() ?? {};
  if (data.userId !== uid) {
    throw new ActionError(
      "FORBIDDEN",
      "Only the hero's player can do that.",
    );
  }
  return { snap };
}

/**
 * Cheap field-level retired-character guard. Throws `INVALID_STATE` when the
 * character is retired so callers don't have to parse the full document.
 * Legacy docs without a `status` field default to "active" — same semantics
 * as `CharacterSchema.status.default("active")`.
 */
export function assertNotRetired(data: DocumentData): void {
  if (data.status === "retired") {
    throw new ActionError(
      "INVALID_STATE",
      "This hero has retired — their sheet is read-only.",
    );
  }
}

/**
 * Authorize a GM-only campaign read/write and return the doc snapshot. Use in
 * every action that mutates campaign state (rename, fellowship edits,
 * invitations, kicks, transfers).
 */
export async function requireCampaignGm(
  campaignId: string,
  uid: string,
  tx?: Transaction,
): Promise<{ snap: DocumentSnapshot<DocumentData> }> {
  const db = getAdminDb();
  const ref = db.collection("campaigns").doc(campaignId);
  const snap = tx ? await tx.get(ref) : await ref.get();
  if (!snap.exists) {
    throw new ActionError("NOT_FOUND", "Campaign not found.");
  }
  const data = snap.data() ?? {};
  if (data.gmUid !== uid) {
    throw new ActionError("FORBIDDEN", "Only the GM can do that.");
  }
  return { snap };
}

/**
 * Authorize a campaign read for any member (GM or player). Returns the
 * snapshot + the caller's role. Used by reads where the GM and members see
 * the same data but different controls.
 */
export async function requireCampaignMembership(
  campaignId: string,
  uid: string,
  tx?: Transaction,
): Promise<CampaignAccess> {
  const db = getAdminDb();
  const ref = db.collection("campaigns").doc(campaignId);
  const snap = tx ? await tx.get(ref) : await ref.get();
  if (!snap.exists) {
    throw new ActionError("NOT_FOUND", "Campaign not found.");
  }
  const data = snap.data() ?? {};
  if (data.gmUid === uid) return { role: "gm", snap };
  const playerUids: string[] = Array.isArray(data.playerUids)
    ? data.playerUids
    : [];
  if (playerUids.includes(uid)) return { role: "member", snap };
  throw new ActionError("FORBIDDEN", "Not a member of this campaign.");
}
