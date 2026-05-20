import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError } from "@/shared/auth";
import {
  CharacterSummarySchema,
  type Character,
  type CharacterSummary,
} from "../schemas";
import { requireCharacterAccess } from "./access";
import { firestoreToCharacter } from "./serialize";

const FIRESTORE_IN_CAP = 30;

/**
 * Dashboard query — characters the user OWNS.
 *
 * TODO(gm-dashboard): once Campaign feature lands, add a separate
 * "Campaigns I run" section that surfaces characters under the user's
 * gmCampaignIds. Mixing them into the owner list would conflate roles.
 *
 * Composite index required: characters (userId asc, updatedAt desc).
 * Captured in firestore.indexes.json. If Firestore prompts for an index URL
 * at runtime, copy the URL from the error and add the equivalent entry.
 */
export async function getMyCharacters(uid: string): Promise<CharacterSummary[]> {
  const db = getAdminDb();
  const charsSnap = await db
    .collection("characters")
    .where("userId", "==", uid)
    .orderBy("updatedAt", "desc")
    .limit(50)
    .get();

  const campaignIds = new Set<string>();
  for (const doc of charsSnap.docs) {
    const ids = (doc.data().campaignIds ?? []) as string[];
    for (const id of ids) campaignIds.add(id);
  }

  const campaignNames = new Map<string, string>();
  if (campaignIds.size > 0) {
    const ids = [...campaignIds].slice(0, FIRESTORE_IN_CAP);
    const campsSnap = await db
      .collection("campaigns")
      .where(FieldPath.documentId(), "in", ids)
      .get();
    for (const c of campsSnap.docs) {
      const name = (c.data().name as string | undefined) ?? "";
      campaignNames.set(c.id, name);
    }
  }

  return charsSnap.docs.map((doc) => {
    const data = doc.data();
    const firstCampId = ((data.campaignIds ?? []) as string[])[0];
    return CharacterSummarySchema.parse({
      id: doc.id,
      name: (data.identity?.name as string | undefined) ?? "",
      concept: (data.identity?.concept as string | undefined) ?? "",
      avatarUrl: (data.identity?.avatarUrl as string | null | undefined) ?? null,
      campaignName: firstCampId ? (campaignNames.get(firstCampId) ?? null) : null,
      promise: (data.progression?.promise as number | undefined) ?? 0,
    });
  });
}

/**
 * Character page query — authorized read of a single character. Authorization
 * via `requireCharacterAccess` (owner or GM). Throws ActionError on access
 * failure; the caller maps NOT_FOUND to notFound() and lets others bubble to
 * error.tsx.
 */
export async function getCharacter(
  rawCharId: string,
  uid: string,
): Promise<{ character: Character; role: "owner" | "gm" }> {
  const { role, snap } = await requireCharacterAccess(rawCharId, uid);
  if (!snap.exists) {
    throw new ActionError("NOT_FOUND", "Character not found.");
  }
  const character = firestoreToCharacter(snap);
  return { character, role };
}
