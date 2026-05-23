import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError } from "@/shared/auth";
import {
  CampaignId,
  CampaignSummarySchema,
  ChallengeId,
  ChallengeSummarySchema,
  CharacterSummarySchema,
  InvitationId,
  type Campaign,
  type CampaignSummary,
  type Challenge,
  type ChallengeSummary,
  type Character,
  type CharacterSummary,
  type EngagedChallenge,
  type Invitation,
  type PendingThreat,
  type SessionLogEntry,
} from "../schemas";
import {
  requireCampaignGm,
  requireCampaignMembership,
  requireCharacterAccess,
} from "./access";
import {
  firestoreToCampaign,
  firestoreToChallenge,
  firestoreToCharacter,
  firestoreToEngagedChallenge,
  firestoreToInvitation,
  firestoreToPendingThreat,
  firestoreToSessionLogEntry,
} from "./serialize";

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
export async function getMyCharacters(
  uid: string,
  options: { includeRetired?: boolean } = {},
): Promise<CharacterSummary[]> {
  const db = getAdminDb();
  const charsSnap = await db
    .collection("characters")
    .where("userId", "==", uid)
    .orderBy("updatedAt", "desc")
    .limit(50)
    .get();

  // Filter client-side so legacy docs lacking a `status` field count as
  // active. Once all docs are backfilled we can move this into the query.
  const docs = options.includeRetired
    ? charsSnap.docs
    : charsSnap.docs.filter(
        (d) => (d.data().status ?? "active") !== "retired",
      );

  const campaignIds = new Set<string>();
  for (const doc of docs) {
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

  return docs.map((doc) => {
    const data = doc.data();
    const firstCampId = ((data.campaignIds ?? []) as string[])[0];
    return CharacterSummarySchema.parse({
      id: doc.id,
      name: (data.identity?.name as string | undefined) ?? "",
      concept: (data.identity?.concept as string | undefined) ?? "",
      avatarUrl: (data.identity?.avatarUrl as string | null | undefined) ?? null,
      campaignName: firstCampId ? (campaignNames.get(firstCampId) ?? null) : null,
      promise: (data.progression?.promise as number | undefined) ?? 0,
      status: (data.status as "active" | "retired" | undefined) ?? "active",
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

/**
 * Authorized read of a campaign doc. Access is granted to the GM, or to any
 * user who owns a character in the campaign's `characterIds`. The client
 * `onSnapshot` listener is backstopped by the `playerUids` field check in
 * firestore.rules — server access uses Admin SDK and checks here.
 */
export async function getCampaign(
  rawCampaignId: string,
  uid: string,
): Promise<Campaign> {
  const campaignId = CampaignId.parse(rawCampaignId);
  const db = getAdminDb();
  const snap = await db.collection("campaigns").doc(campaignId).get();
  if (!snap.exists) {
    throw new ActionError("NOT_FOUND", "Campaign not found.");
  }
  const data = snap.data() ?? {};
  if (data.gmUid !== uid) {
    const playerUids = Array.isArray(data.playerUids)
      ? (data.playerUids as string[])
      : [];
    if (!playerUids.includes(uid)) {
      throw new ActionError("FORBIDDEN", "No access to that campaign.");
    }
  }
  return firestoreToCampaign(snap);
}

/**
 * Dashboard / campaigns list query — every campaign the user is a member of
 * (GM or player). Ordered by recent activity.
 *
 * Requires composite index: campaigns (playerUids array-contains, updatedAt desc).
 */
export async function getMyCampaigns(uid: string): Promise<CampaignSummary[]> {
  const db = getAdminDb();
  const snap = await db
    .collection("campaigns")
    .where("playerUids", "array-contains", uid)
    .orderBy("updatedAt", "desc")
    .limit(20)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return CampaignSummarySchema.parse({
      id: d.id,
      name: data.name,
      gmUid: data.gmUid,
      rosterCount: Array.isArray(data.roster) ? data.roster.length : 0,
    });
  });
}

/**
 * Campaign page query — campaign doc + all member characters, authorized via
 * membership (GM or player). Caller branches on `role` for GM-only UI.
 */
export async function getCampaignWithRoster(
  rawCampaignId: string,
  uid: string,
): Promise<{
  campaign: Campaign;
  role: "gm" | "member";
  characters: Character[];
}> {
  const campaignId = CampaignId.parse(rawCampaignId);
  const { snap, role } = await requireCampaignMembership(campaignId, uid);
  const campaign = firestoreToCampaign(snap);

  let characters: Character[] = [];
  const charIds = campaign.characterIds.slice(0, 10);
  if (charIds.length > 0) {
    const db = getAdminDb();
    const charsSnap = await db
      .collection("characters")
      .where(FieldPath.documentId(), "in", charIds)
      .get();
    characters = charsSnap.docs.map((d) => firestoreToCharacter(d));
  }
  return { campaign, role, characters };
}

/**
 * Look up an invitation by id. Used by /invite/[token] to render the
 * redemption view. No auth check beyond signed-in — rules + the action
 * gate the actual mutations.
 */
export async function getInvitation(
  rawInvitationId: string,
): Promise<Invitation> {
  const invitationId = InvitationId.parse(rawInvitationId);
  const db = getAdminDb();
  const snap = await db.collection("invitations").doc(invitationId).get();
  if (!snap.exists) {
    throw new ActionError("NOT_FOUND", "Invitation not found.");
  }
  return firestoreToInvitation(snap);
}

/**
 * Character page query that also fetches the active campaign (first
 * entry in `character.campaignIds`). Gracefully degrades to `campaign: null`
 * when the user has no access or the campaign is missing — the character
 * sheet still loads.
 */
/**
 * List GM-owned challenges for a campaign — summaries only. Authorization
 * via `requireCampaignGm`; only the GM ever calls this. Limit 50.
 */
export async function listChallenges(
  rawCampaignId: string,
  uid: string,
): Promise<ChallengeSummary[]> {
  const campaignId = CampaignId.parse(rawCampaignId);
  await requireCampaignGm(campaignId, uid);
  const db = getAdminDb();
  const snap = await db
    .collection("campaigns")
    .doc(campaignId)
    .collection("challenges")
    .orderBy("updatedAt", "desc")
    .limit(50)
    .get();
  return snap.docs.map((d) => {
    const data = d.data();
    return ChallengeSummarySchema.parse({
      id: d.id,
      name: data.name,
      role: data.role,
      mightLevel: data.mightLevel,
      threatCount: Array.isArray(data.threats) ? data.threats.length : 0,
      limitCount: Array.isArray(data.limits) ? data.limits.length : 0,
    });
  });
}

/**
 * Authorized read of a single challenge — GM-only. Throws ActionError NOT_FOUND
 * when missing; the route layout maps it to notFound().
 */
export async function getChallenge(
  rawCampaignId: string,
  rawChallengeId: string,
  uid: string,
): Promise<Challenge> {
  const campaignId = CampaignId.parse(rawCampaignId);
  const challengeId = ChallengeId.parse(rawChallengeId);
  await requireCampaignGm(campaignId, uid);
  const db = getAdminDb();
  const ref = db
    .collection("campaigns")
    .doc(campaignId)
    .collection("challenges")
    .doc(challengeId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new ActionError("NOT_FOUND", "Challenge not found.");
  }
  return firestoreToChallenge(snap);
}

/**
 * Read the most recent session-log entries for a campaign. Authorized via
 * membership — GM and players see the same set. Malformed docs are skipped
 * (logged) so one bad entry can't break the page.
 */
export async function getSessionLog(
  rawCampaignId: string,
  uid: string,
  limitN: number = 100,
): Promise<SessionLogEntry[]> {
  const campaignId = CampaignId.parse(rawCampaignId);
  await requireCampaignMembership(campaignId, uid);
  const db = getAdminDb();
  const snap = await db
    .collection("campaigns")
    .doc(campaignId)
    .collection("sessionLog")
    .orderBy("createdAt", "desc")
    .limit(limitN)
    .get();
  const entries: SessionLogEntry[] = [];
  for (const doc of snap.docs) {
    try {
      entries.push(firestoreToSessionLogEntry(doc));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[session-log] skipping malformed entry", doc.id, err);
    }
  }
  return entries;
}

/**
 * Read the campaign's engaged-challenge mirror docs (player-visible subset).
 * Any member (GM or playerUid) may call; the mirror itself is intentionally
 * thin — statuses/limits/threats/notes stay on the GM-only source doc.
 */
export async function getEngagedChallenges(
  rawCampaignId: string,
  uid: string,
): Promise<EngagedChallenge[]> {
  const campaignId = CampaignId.parse(rawCampaignId);
  await requireCampaignMembership(campaignId, uid);
  const db = getAdminDb();
  const snap = await db
    .collection("campaigns")
    .doc(campaignId)
    .collection("engagedChallenges")
    .get();
  const result: EngagedChallenge[] = [];
  for (const doc of snap.docs) {
    try {
      result.push(firestoreToEngagedChallenge(doc));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[engaged-challenges] malformed mirror", doc.id, err);
    }
  }
  return result;
}

/**
 * Read active (awaitingReaction | reactionRolled) pending threats for a
 * campaign. Members + GM see the same set; client UIs branch on role to
 * decide what to render.
 */
export async function getPendingThreats(
  rawCampaignId: string,
  uid: string,
): Promise<PendingThreat[]> {
  const campaignId = CampaignId.parse(rawCampaignId);
  await requireCampaignMembership(campaignId, uid);
  const db = getAdminDb();
  const snap = await db
    .collection("campaigns")
    .doc(campaignId)
    .collection("pendingThreats")
    .where("status", "in", ["awaitingReaction", "reactionRolled"])
    .orderBy("createdAt", "desc")
    .limit(20)
    .get();
  const result: PendingThreat[] = [];
  for (const doc of snap.docs) {
    try {
      result.push(firestoreToPendingThreat(doc));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[pending-threats] malformed", doc.id, err);
    }
  }
  return result;
}

export async function getCharacterWithCampaign(
  rawCharId: string,
  uid: string,
): Promise<{
  character: Character;
  role: "owner" | "gm";
  campaign: Campaign | null;
}> {
  const { character, role } = await getCharacter(rawCharId, uid);
  const campaignId = character.campaignIds[0];
  if (!campaignId) return { character, role, campaign: null };
  try {
    const campaign = await getCampaign(campaignId, uid);
    return { character, role, campaign };
  } catch (err) {
    if (
      err instanceof ActionError &&
      (err.code === "NOT_FOUND" || err.code === "FORBIDDEN")
    ) {
      return { character, role, campaign: null };
    }
    throw err;
  }
}
