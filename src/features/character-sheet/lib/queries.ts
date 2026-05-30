import "server-only";
import { FieldPath } from "firebase-admin/firestore";
import { getAdminDb, getAdminStorage } from "@/shared/firebase/admin";
import { ActionError } from "@/shared/auth";
import {
  parseCharacterIdFromAvatarPath,
  parseStoragePathFromUrl,
} from "@/shared/lib/storage-paths";
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
  type RollRecord,
  type Session,
  type SessionLogEntry,
  type UserSettings,
  defaultSettingsFor,
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
  firestoreToRollRecord,
  firestoreToSession,
  firestoreToSessionLogEntry,
  firestoreToUserSettings,
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
    // Prefer the new structured avatar thumb; fall back to legacy
    // identity.avatarUrl so pre-feature characters still render.
    const avatarThumb =
      ((data.avatar as { thumbUrl?: string } | null | undefined)
        ?.thumbUrl as string | undefined) ?? null;
    const legacyAvatar =
      (data.identity?.avatarUrl as string | null | undefined) ?? null;
    return CharacterSummarySchema.parse({
      id: doc.id,
      name: (data.identity?.name as string | undefined) ?? "",
      concept: (data.identity?.concept as string | undefined) ?? "",
      avatarUrl: avatarThumb ?? legacyAvatar,
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

/**
 * Per-campaign session list, newest first, capped at 50.
 */
export async function listSessions(
  rawCampaignId: string,
  uid: string,
): Promise<Session[]> {
  const campaignId = CampaignId.parse(rawCampaignId);
  await requireCampaignMembership(campaignId, uid);
  const db = getAdminDb();
  const snap = await db
    .collection("campaigns")
    .doc(campaignId)
    .collection("sessions")
    .orderBy("sessionNumber", "desc")
    .limit(50)
    .get();
  const result: Session[] = [];
  for (const doc of snap.docs) {
    try {
      result.push(firestoreToSession(doc));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[sessions] malformed", doc.id, err);
    }
  }
  return result;
}

export interface TierDistribution {
  success: number;
  mixed: number;
  failure: number;
  reaction: number;
}

export interface CharacterSessionStats {
  characterId: string;
  characterName: string;
  rollCount: number;
  tierDistribution: TierDistribution;
}

export interface SessionStats {
  durationMs: number | null;
  rollCount: number;
  tierDistribution: TierDistribution;
  deliverThreatCount: number;
  momentOfFulfillmentCount: number;
  campActionCount: number;
  themeAdvancementCount: number;
  annotationCount: number;
  // NOTE: prompt 15 reaction resolutions are logged under "deliverThreat"
  // kind, so they count toward deliverThreatCount. If a future prompt adds
  // a dedicated session-log kind for reaction outcomes, split it out here.
}

export interface SessionDetail {
  session: Session;
  stats: SessionStats;
  characterStats: CharacterSessionStats[];
  logEntries: SessionLogEntry[];
}

/**
 * Per-session analytics. Any campaign member may read. Pulls rolls via
 * a collection-group query tagged by sessionId (requires composite index
 * sessionId asc + createdAt asc). Stats computed live — no caching.
 */
export async function getSessionDetail(
  rawCampaignId: string,
  rawSessionId: string,
  uid: string,
): Promise<SessionDetail> {
  const campaignId = CampaignId.parse(rawCampaignId);
  await requireCampaignMembership(campaignId, uid);
  const db = getAdminDb();

  const sessionRef = db
    .collection("campaigns")
    .doc(campaignId)
    .collection("sessions")
    .doc(rawSessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    throw new ActionError("NOT_FOUND", "Session not found.");
  }
  const session = firestoreToSession(sessionSnap);

  const campSnap = await db.collection("campaigns").doc(campaignId).get();
  if (!campSnap.exists) {
    throw new ActionError("NOT_FOUND", "Campaign not found.");
  }
  const campaign = firestoreToCampaign(campSnap);

  const rollsSnap = await db
    .collectionGroup("rolls")
    .where("sessionId", "==", rawSessionId)
    .get();

  const logSnap = await db
    .collection("campaigns")
    .doc(campaignId)
    .collection("sessionLog")
    .where("sessionId", "==", rawSessionId)
    .orderBy("createdAt", "asc")
    .get();

  const logEntries: SessionLogEntry[] = [];
  for (const doc of logSnap.docs) {
    try {
      logEntries.push(firestoreToSessionLogEntry(doc));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[session-detail] malformed log entry", doc.id, err);
    }
  }

  const tierDistribution: TierDistribution = {
    success: 0,
    mixed: 0,
    failure: 0,
    reaction: 0,
  };
  const rollsByCharacter = new Map<string, RollRecord[]>();
  for (const doc of rollsSnap.docs) {
    try {
      const roll = firestoreToRollRecord(doc);
      if (roll.isReaction) tierDistribution.reaction += 1;
      else if (roll.tier === "success") tierDistribution.success += 1;
      else if (roll.tier === "mixed") tierDistribution.mixed += 1;
      else if (roll.tier === "failure") tierDistribution.failure += 1;

      const list = rollsByCharacter.get(roll.characterId) ?? [];
      list.push(roll);
      rollsByCharacter.set(roll.characterId, list);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[session-detail] malformed roll", doc.id, err);
    }
  }

  const characterStats: CharacterSessionStats[] = campaign.roster.map(
    (rosterEntry) => {
      const rolls = rollsByCharacter.get(rosterEntry.characterId) ?? [];
      const charTier: TierDistribution = {
        success: 0,
        mixed: 0,
        failure: 0,
        reaction: 0,
      };
      for (const r of rolls) {
        if (r.isReaction) charTier.reaction += 1;
        else if (r.tier === "success") charTier.success += 1;
        else if (r.tier === "mixed") charTier.mixed += 1;
        else if (r.tier === "failure") charTier.failure += 1;
      }
      return {
        characterId: rosterEntry.characterId,
        characterName: rosterEntry.characterName,
        rollCount: rolls.length,
        tierDistribution: charTier,
      };
    },
  );
  characterStats.sort((a, b) => b.rollCount - a.rollCount);

  const kindCounts: Record<string, number> = {};
  for (const entry of logEntries) {
    kindCounts[entry.details.kind] = (kindCounts[entry.details.kind] ?? 0) + 1;
  }

  const durationMs = session.endedAt
    ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
    : null;

  return {
    session,
    stats: {
      durationMs,
      rollCount: rollsSnap.docs.length,
      tierDistribution,
      deliverThreatCount: kindCounts.deliverThreat ?? 0,
      momentOfFulfillmentCount: kindCounts.momentOfFulfillment ?? 0,
      campActionCount: kindCounts.campAction ?? 0,
      themeAdvancementCount: kindCounts.themeAdvancement ?? 0,
      annotationCount: kindCounts.annotation ?? 0,
    },
    characterStats,
    logEntries,
  };
}

export interface EndOfSessionSummary {
  characters: Array<{
    characterId: string;
    name: string;
    burnedTagCount: number;
    scratchedPowerTagCount: number;
    promise: number;
    momentOfFulfillmentReady: boolean;
  }>;
  campaign: {
    fellowshipScratchedCount: number;
  };
  sessionStats: {
    sessionId: string;
    sessionNumber: number;
    startedAt: string;
    rollCount: number;
    deliverThreatCount: number;
    momentOfFulfillmentCount: number;
    campActionCount: number;
  } | null;
}

/**
 * GM-only — computes a live summary panel for the end-session dialog.
 * Bounded reads: 1 campaign + N character + 1 session + log-by-session +
 * N count() aggregates. Suitable for on-demand dialog open, not for
 * frequent polling.
 */
export async function getEndOfSessionSummary(
  rawCampaignId: string,
  uid: string,
): Promise<EndOfSessionSummary> {
  const campaignId = CampaignId.parse(rawCampaignId);
  await requireCampaignGm(campaignId, uid);
  const db = getAdminDb();

  const campSnap = await db.collection("campaigns").doc(campaignId).get();
  if (!campSnap.exists) {
    throw new ActionError("NOT_FOUND", "Campaign not found.");
  }
  const campaign = firestoreToCampaign(campSnap);

  const characterIds = campaign.roster.map((r) => r.characterId);
  const charDocs = await Promise.all(
    characterIds.map((id) => db.collection("characters").doc(id).get()),
  );
  const characters = charDocs
    .filter((d) => d.exists)
    .map((d) => {
      const c = firestoreToCharacter(d);
      const burnedTagCount = c.themes.reduce(
        (sum, t) => sum + t.powerTags.filter((tag) => tag.burned).length,
        0,
      );
      const scratchedPowerTagCount = c.themes.reduce(
        (sum, t) =>
          sum +
          t.powerTags.filter((tag) => tag.scratched && !tag.burned).length,
        0,
      );
      return {
        characterId: c.id,
        name: c.identity.name,
        burnedTagCount,
        scratchedPowerTagCount,
        promise: c.progression.promise,
        momentOfFulfillmentReady:
          c.progression.promise === 5 && c.status === "active",
      };
    });

  const fellowshipScratchedCount = campaign.fellowship.powerTags.filter(
    (t) => t.scratched,
  ).length;

  let sessionStats: EndOfSessionSummary["sessionStats"] = null;
  if (campaign.activeSessionId) {
    const sessionRef = db
      .collection("campaigns")
      .doc(campaignId)
      .collection("sessions")
      .doc(campaign.activeSessionId);
    const sessionSnap = await sessionRef.get();
    if (sessionSnap.exists) {
      const session = firestoreToSession(sessionSnap);
      const logSnap = await db
        .collection("campaigns")
        .doc(campaignId)
        .collection("sessionLog")
        .where("sessionId", "==", campaign.activeSessionId)
        .get();
      let deliverThreatCount = 0;
      let momentOfFulfillmentCount = 0;
      let campActionCount = 0;
      for (const doc of logSnap.docs) {
        const kind = (
          doc.data().details as { kind?: string } | undefined
        )?.kind;
        if (kind === "deliverThreat") deliverThreatCount += 1;
        else if (kind === "momentOfFulfillment")
          momentOfFulfillmentCount += 1;
        else if (kind === "campAction") campActionCount += 1;
      }
      const startedAtDate = new Date(session.startedAt);
      const rollCounts = await Promise.all(
        characterIds.map(async (id) => {
          const agg = await db
            .collection("characters")
            .doc(id)
            .collection("rolls")
            .where("createdAt", ">=", startedAtDate)
            .count()
            .get();
          return agg.data().count;
        }),
      );
      const rollCount = rollCounts.reduce((a, b) => a + b, 0);
      sessionStats = {
        sessionId: session.id,
        sessionNumber: session.sessionNumber,
        startedAt: session.startedAt,
        rollCount,
        deliverThreatCount,
        momentOfFulfillmentCount,
        campActionCount,
      };
    }
  }

  return {
    characters,
    campaign: { fellowshipScratchedCount },
    sessionStats,
  };
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

/**
 * Fetch the caller's user settings server-side, falling back to defaults when
 * no doc exists yet. Use in Server Components that need to gate behavior on
 * settings (e.g., dashboard's showRetiredCharacters default).
 */
export async function getUserSettingsServerSide(
  uid: string,
): Promise<UserSettings> {
  const db = getAdminDb();
  const snap = await db.collection("userSettings").doc(uid).get();
  return firestoreToUserSettings(snap) ?? defaultSettingsFor(uid);
}

export interface CampaignCleanupPreview {
  characterCount: number;
  retiredCharacterCount: number;
  powerTagsScratched: number;
  powerTagsBurned: number;
  hinderingStatuses: number;
  nonPreservedStoryTags: number;
  fellowshipTagsScratched: number;
  engagedChallengeTagsScratched: number;
}

/**
 * GM-only. Aggregate counts driving the BulkCleanupDialog preview. Retired
 * heroes are excluded from the per-character counts (cleanup skips them).
 */
export async function getCampaignCleanupPreview(
  campaignId: string,
  uid: string,
): Promise<CampaignCleanupPreview> {
  await requireCampaignGm(campaignId, uid);
  const db = getAdminDb();

  const campSnap = await db.collection("campaigns").doc(campaignId).get();
  if (!campSnap.exists) {
    throw new ActionError("NOT_FOUND", "Campaign not found.");
  }
  const campaign = firestoreToCampaign(campSnap);

  const characterIds = campaign.roster.map((r) => r.characterId);
  const charSnaps = await Promise.all(
    characterIds.map((id) => db.collection("characters").doc(id).get()),
  );

  let powerTagsScratched = 0;
  let powerTagsBurned = 0;
  let hinderingStatuses = 0;
  let nonPreservedStoryTags = 0;
  let activeCharacterCount = 0;
  let retiredCharacterCount = 0;

  for (const snap of charSnaps) {
    if (!snap.exists) continue;
    let character: Character;
    try {
      character = firestoreToCharacter(snap);
    } catch (err) {
      console.warn("[cleanup-preview] character parse", snap.id, err);
      continue;
    }
    if (character.status === "retired") {
      retiredCharacterCount += 1;
      continue;
    }
    activeCharacterCount += 1;
    for (const theme of character.themes) {
      for (const tag of theme.powerTags) {
        if (tag.burned) powerTagsBurned += 1;
        else if (tag.scratched) powerTagsScratched += 1;
      }
    }
    hinderingStatuses += character.statuses.filter(
      (s) => s.polarity === "hindering",
    ).length;
    nonPreservedStoryTags += character.backpack.storyTags.filter(
      (t) => !t.preserved,
    ).length;
  }

  const fellowshipTagsScratched = campaign.fellowship.powerTags.filter(
    (t) => t.scratched,
  ).length;

  const engagedSnap = await db
    .collection("campaigns")
    .doc(campaignId)
    .collection("engagedChallenges")
    .get();
  let engagedChallengeTagsScratched = 0;
  for (const doc of engagedSnap.docs) {
    const data = doc.data();
    const tags = (data.tags ?? []) as Array<{ scratched?: boolean }>;
    engagedChallengeTagsScratched += tags.filter(
      (t) => t.scratched === true,
    ).length;
  }

  return {
    characterCount: activeCharacterCount,
    retiredCharacterCount,
    powerTagsScratched,
    powerTagsBurned,
    hinderingStatuses,
    nonPreservedStoryTags,
    fellowshipTagsScratched,
    engagedChallengeTagsScratched,
  };
}

export interface PendingAllocation {
  rollId: string;
  characterId: CharacterSummary["id"];
  characterName: string;
  ownerUid: string;
  challengeId: ChallengeSummary["id"];
  challengeName: string;
  campaignId: CampaignSummary["id"];
  power: number;
  createdAt: string;
}

/**
 * GM-only. Collection-group query over `rolls` for Detailed actions in this
 * campaign that haven't had their Power allocated yet. Used by the campaign
 * page's PendingAllocationsPanel so the GM can act on behalf of offline
 * players. Throws FORBIDDEN when the caller isn't the GM.
 */
export async function getPendingAllocations(
  campaignId: string,
  uid: string,
): Promise<PendingAllocation[]> {
  await requireCampaignGm(campaignId, uid);
  const db = getAdminDb();

  const rollSnaps = await db
    .collectionGroup("rolls")
    .where("isDetailedAction", "==", true)
    .where("limitAllocationApplied", "==", false)
    .where("detailedActionTarget.campaignId", "==", campaignId)
    .orderBy("createdAt", "desc")
    .limit(30)
    .get();

  interface RollEntry {
    roll: RollRecord;
    characterId: string;
  }
  const entries: RollEntry[] = [];
  const uniqueCharacterIds = new Set<string>();

  for (const doc of rollSnaps.docs) {
    try {
      const roll = firestoreToRollRecord(doc);
      if (roll.power <= 0) continue;
      if (!roll.detailedActionTarget) continue;
      const charRef = doc.ref.parent.parent;
      if (!charRef) continue;
      entries.push({ roll, characterId: charRef.id });
      uniqueCharacterIds.add(charRef.id);
    } catch (err) {
      console.warn("[pending-allocations] skip malformed roll", doc.id, err);
    }
  }

  const charSnaps = await Promise.all(
    Array.from(uniqueCharacterIds).map((id) =>
      db.collection("characters").doc(id).get(),
    ),
  );
  const characters = new Map<string, Character>();
  for (const snap of charSnaps) {
    if (!snap.exists) continue;
    try {
      characters.set(snap.id, firestoreToCharacter(snap));
    } catch (err) {
      console.warn(
        "[pending-allocations] character parse",
        snap.id,
        err,
      );
    }
  }

  const result: PendingAllocation[] = [];
  for (const { roll, characterId } of entries) {
    const character = characters.get(characterId);
    if (!character) continue;
    if (!roll.detailedActionTarget) continue;
    result.push({
      rollId: roll.id,
      characterId: character.id,
      characterName: character.identity.name,
      ownerUid: character.userId,
      challengeId: roll.detailedActionTarget.challengeId,
      challengeName: roll.detailedActionTarget.challengeName,
      campaignId: roll.detailedActionTarget.campaignId,
      power: roll.power,
      createdAt: roll.createdAt,
    });
  }
  return result;
}

// ---------------------------------------------------------------------------
// Storage usage — per-user Firebase Storage accounting + orphan detection.
// Storage is the source of truth (no Firestore mirror). A file is an "orphan"
// when its path isn't referenced by the owning character's `avatar` field.
// ---------------------------------------------------------------------------

export type StorageFileEntry = {
  path: string;
  bytes: number;
  contentType: string;
  timeCreated: string;
  /** True when this file isn't referenced by the character's current avatar. */
  isOrphan: boolean;
};

export type CharacterStorageUsage = {
  characterId: string;
  /** null when the character doc is missing in Firestore (defensive). */
  characterName: string | null;
  bytes: number;
  fileCount: number;
  files: StorageFileEntry[];
  /** True when EVERY file under this character is unreferenced. */
  isOrphan: boolean;
};

export type UserStorageUsage = {
  uid: string;
  totalBytes: number;
  totalFileCount: number;
  byCharacter: CharacterStorageUsage[];
  orphanBytes: number;
  orphanFileCount: number;
  /** Files that don't fit the user/character/avatar path shape. Counted as orphans. */
  unrecognizedFiles: StorageFileEntry[];
};

type RawStorageFile = Omit<StorageFileEntry, "isOrphan">;

/** Minimal shape we read off a raw character doc — avoids parsing the full schema. */
type CharacterAvatarRefs = {
  avatar?: { mainUrl?: string; thumbUrl?: string } | null;
  identity?: { name?: string };
};

/**
 * Per-user Storage usage with orphan detection. Cross-checks every stored file
 * against the owning character's `avatar.mainUrl` / `avatar.thumbUrl`.
 *
 * Cost: 1 Storage list + one Firestore read per distinct character with files.
 * The `uid` MUST come from the verified session — there is no surface for one
 * user to read another's storage.
 */
export async function getUserStorageUsage(
  uid: string,
): Promise<UserStorageUsage> {
  const bucket = getAdminStorage().bucket();
  const [files] = await bucket.getFiles({ prefix: `users/${uid}/` });

  // Group raw files by characterId via path parsing.
  const filesByCharacter = new Map<string, RawStorageFile[]>();
  const unrecognizedRaw: RawStorageFile[] = [];

  for (const file of files) {
    const raw: RawStorageFile = {
      path: file.name,
      bytes: Number(file.metadata.size ?? 0),
      contentType: String(file.metadata.contentType ?? "application/octet-stream"),
      timeCreated: String(file.metadata.timeCreated ?? ""),
    };
    const charId = parseCharacterIdFromAvatarPath(file.name);
    if (charId === null) {
      unrecognizedRaw.push(raw);
      continue;
    }
    const list = filesByCharacter.get(charId) ?? [];
    list.push(raw);
    filesByCharacter.set(charId, list);
  }

  // Cross-check vs Firestore — one read per character, mark each file inline.
  const db = getAdminDb();
  const byCharacter: CharacterStorageUsage[] = [];

  for (const [characterId, rawFiles] of filesByCharacter.entries()) {
    const snap = await db.collection("characters").doc(characterId).get();
    const data = snap.exists
      ? (snap.data() as CharacterAvatarRefs | undefined)
      : undefined;

    const referencedPaths = new Set<string>();
    const avatar = data?.avatar;
    if (avatar) {
      const main = avatar.mainUrl ? parseStoragePathFromUrl(avatar.mainUrl) : null;
      const thumb = avatar.thumbUrl
        ? parseStoragePathFromUrl(avatar.thumbUrl)
        : null;
      if (main) referencedPaths.add(main);
      if (thumb) referencedPaths.add(thumb);
    }

    const charFiles: StorageFileEntry[] = rawFiles.map((f) => ({
      ...f,
      isOrphan: !referencedPaths.has(f.path),
    }));

    const name =
      typeof data?.identity?.name === "string" ? data.identity.name : null;

    byCharacter.push({
      characterId,
      characterName: name,
      bytes: charFiles.reduce((sum, f) => sum + f.bytes, 0),
      fileCount: charFiles.length,
      files: charFiles,
      isOrphan: charFiles.every((f) => f.isOrphan),
    });
  }

  // Unrecognized files shouldn't exist at all — always orphans.
  const unrecognizedFiles: StorageFileEntry[] = unrecognizedRaw.map((f) => ({
    ...f,
    isOrphan: true,
  }));

  const totalBytes =
    byCharacter.reduce((s, c) => s + c.bytes, 0) +
    unrecognizedFiles.reduce((s, f) => s + f.bytes, 0);
  const totalFileCount =
    byCharacter.reduce((s, c) => s + c.fileCount, 0) + unrecognizedFiles.length;

  let orphanBytes = 0;
  let orphanFileCount = 0;
  for (const c of byCharacter) {
    for (const f of c.files) {
      if (f.isOrphan) {
        orphanBytes += f.bytes;
        orphanFileCount += 1;
      }
    }
  }
  for (const f of unrecognizedFiles) {
    orphanBytes += f.bytes;
    orphanFileCount += 1;
  }

  return {
    uid,
    totalBytes,
    totalFileCount,
    byCharacter: byCharacter.sort((a, b) => b.bytes - a.bytes),
    orphanBytes,
    orphanFileCount,
    unrecognizedFiles,
  };
}
