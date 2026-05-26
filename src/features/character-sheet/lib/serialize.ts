import {
  CampaignSchema,
  ChallengeSchema,
  CharacterSchema,
  EngagedChallengeSchema,
  InvitationSchema,
  PendingThreatSchema,
  PresenceDocSchema,
  RollRecordSchema,
  SessionLogEntrySchema,
  SessionSchema,
  UserSettingsSchema,
  type Campaign,
  type Challenge,
  type Character,
  type EngagedChallenge,
  type Invitation,
  type PendingThreat,
  type PresenceDoc,
  type RollRecord,
  type Session,
  type SessionLogEntry,
  type UserSettings,
} from "../schemas";

type TimestampLike = { toDate(): Date };

export function toIso(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as TimestampLike).toDate === "function"
  ) {
    return (value as TimestampLike).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  throw new Error("Invalid timestamp value");
}

type SnapshotLike = {
  id: string;
  data(): Record<string, unknown> | undefined;
};

// TODO(cleanup): remove migration after a few sessions, once all stored
// fellowship.relationships docs have been rewritten with the new shape
// (id + companionName + companionCharId + polarity).
function migrateRelationships(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return { relationships: [] };
  const fellowship = raw as Record<string, unknown>;
  const list = Array.isArray(fellowship.relationships)
    ? fellowship.relationships
    : [];
  const migrated = list.map((entry) => {
    const rel = (entry ?? {}) as Record<string, unknown>;
    const id =
      typeof rel.id === "string" && rel.id.length > 0
        ? rel.id
        : crypto.randomUUID();
    const companionName =
      typeof rel.companionName === "string" && rel.companionName.length > 0
        ? rel.companionName
        : typeof rel.partnerName === "string" && rel.partnerName.length > 0
          ? rel.partnerName
          : "Unknown";
    const relationshipTag =
      typeof rel.relationshipTag === "string" && rel.relationshipTag.length > 0
        ? rel.relationshipTag
        : "ally";
    const polarity =
      rel.polarity === "hindering" ? "hindering" : "helpful";
    const companionCharId =
      typeof rel.companionCharId === "string" ? rel.companionCharId : null;
    return { id, companionCharId, companionName, relationshipTag, polarity };
  });
  return { relationships: migrated };
}

/**
 * Convert any Firestore character snapshot (Admin SDK or Client SDK) to the
 * validated wire-shape `Character`. Duck-typed via `SnapshotLike` so the
 * function does not couple to either SDK. Timestamps become ISO strings;
 * the result is parsed against `CharacterSchema`, which throws if the doc
 * has drifted from the schema. Never let raw Firestore data cross past
 * this boundary.
 */
export function firestoreToCharacter(snap: SnapshotLike): Character {
  const data = snap.data();
  if (!data) {
    throw new Error(`Character ${snap.id} not found.`);
  }
  const migrated = migrateQuintessencesAndMoF(data, snap.id);
  return CharacterSchema.parse({
    ...data,
    id: snap.id,
    fellowship: migrateRelationships(data.fellowship),
    progression: migrated.progression,
    quintessences: migrated.quintessences,
    momentsOfFulfillment: migrated.momentsOfFulfillment,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  });
}

/**
 * Legacy → current shape migration for Quintessences + Moments of
 * Fulfillment. Pre-refactor docs stored quintessences as `string[]` and
 * MoF entries as a flat `{id, chosenPath, description, ...}` shape, both
 * nested under `progression`. They've since moved to top-level character
 * fields with structured shapes. This helper pulls them out at parse time
 * so write paths only ever touch the new fields.
 *
 * Writes from this codebase always store the new shape under the top-level
 * fields. If both old and new exist on a doc (mid-flight), the new fields
 * win — legacy is treated as the seed-only fallback.
 */
function migrateQuintessencesAndMoF(
  data: Record<string, unknown>,
  charId: string,
): {
  progression: { promise: number };
  quintessences: unknown[];
  momentsOfFulfillment: unknown[];
} {
  const progressionRaw = (data.progression ?? {}) as Record<string, unknown>;
  const promise =
    typeof progressionRaw.promise === "number" ? progressionRaw.promise : 0;

  const topQuintessences = Array.isArray(data.quintessences)
    ? (data.quintessences as unknown[])
    : null;
  const legacyQuintessences = Array.isArray(progressionRaw.quintessences)
    ? (progressionRaw.quintessences as unknown[])
    : null;

  const quintessences: unknown[] = (() => {
    if (topQuintessences && topQuintessences.length > 0) return topQuintessences;
    if (legacyQuintessences === null) return [];
    // Legacy string[] → synthesize structured objects. The deterministic
    // id `${charId}:legacy-quintessence:<index>` keeps Firestore-rule diffs
    // stable across reads and ties scratched-state migrations (none in
    // legacy) to the original ordinal.
    return legacyQuintessences.map((entry, idx) => {
      if (typeof entry === "string") {
        return {
          id: `${charId}:legacy-quintessence:${idx}`,
          name: entry,
          scratched: false,
          sourceMoFEntryId: `${charId}:legacy-source:${idx}`,
          createdAt: "1970-01-01T00:00:00.000Z",
        };
      }
      return entry; // Already structured (shouldn't happen via this branch).
    });
  })();

  const topMoF = Array.isArray(data.momentsOfFulfillment)
    ? (data.momentsOfFulfillment as unknown[])
    : null;
  const legacyMoF = Array.isArray(progressionRaw.momentsOfFulfillment)
    ? (progressionRaw.momentsOfFulfillment as unknown[])
    : null;

  const momentsOfFulfillment: unknown[] = (() => {
    if (topMoF && topMoF.length > 0) return topMoF;
    if (legacyMoF === null) return [];
    // Legacy flat shape: `{id, chosenPath, description, burnedTagsRestored,
    // completedAt}` → discriminated entry. Most paths collapse to a
    // narrativeDescription field; retire collapses to finalWords. Reforge
    // and speakWordsEternal lack the path-specific snapshot fields they
    // now require (newThemeId etc.) — those legacy entries land in the
    // path-specific schema with empty/synthesized values so parse still
    // succeeds. UI surfaces these as best-effort summaries.
    return legacyMoF.map((entry) => {
      const e = (entry ?? {}) as Record<string, unknown>;
      const id = (typeof e.id === "string" && e.id) || `legacy-mof:${Math.random()}`;
      const description = typeof e.description === "string" ? e.description : "";
      const resolvedAt =
        typeof e.completedAt === "string"
          ? e.completedAt
          : "1970-01-01T00:00:00.000Z";
      const path = typeof e.chosenPath === "string" ? e.chosenPath : "shakeWorld";
      switch (path) {
        case "retire":
          return { id, path, resolvedAt, finalWords: description };
        case "reforge":
          return {
            id,
            path,
            resolvedAt,
            replacedThemeName: "",
            newThemeId: `${id}:legacy-theme`,
            newThemeName: "",
            narrativeDescription: description,
          };
        case "gainQuintessence":
          return {
            id,
            path,
            resolvedAt,
            quintessenceName: description || "Unnamed",
            narrativeDescription: "",
          };
        case "speakWordsEternal":
          return {
            id,
            path,
            resolvedAt,
            themeId: `${id}:legacy-theme`,
            themeName: "",
            newPowerTagName: description || "Unnamed",
            newPowerTagId: `${id}:legacy-tag`,
            narrativeDescription: "",
          };
        case "unearthTruths":
        case "shakeWorld":
        default:
          return {
            id,
            path,
            resolvedAt,
            narrativeDescription: description || "—",
          };
      }
    });
  })();

  return {
    progression: { promise },
    quintessences,
    momentsOfFulfillment,
  };
}

/**
 * Convert a Firestore campaign snapshot to the validated wire-shape
 * `Campaign`. Mirrors `firestoreToCharacter`.
 */
export function firestoreToCampaign(snap: SnapshotLike): Campaign {
  const data = snap.data();
  if (!data) {
    throw new Error(`Campaign ${snap.id} not found.`);
  }
  return CampaignSchema.parse({
    ...data,
    id: snap.id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  });
}

function toIsoNullable(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return toIso(value);
}

/**
 * Convert a Firestore invitation snapshot to the validated wire-shape
 * `Invitation`. `consumedAt` may be null when the invite is still open.
 */
export function firestoreToInvitation(snap: SnapshotLike): Invitation {
  const data = snap.data();
  if (!data) {
    throw new Error(`Invitation ${snap.id} not found.`);
  }
  // Legacy invitations (pre-directed-flow) lack the `kind` discriminator —
  // they were all token-based. Inject "token" so the union parses.
  const normalized = {
    ...data,
    id: snap.id,
    kind:
      typeof data.kind === "string"
        ? data.kind
        : data.directedAtUid
          ? "directed"
          : "token",
    createdAt: toIso(data.createdAt),
    expiresAt: toIso(data.expiresAt),
    consumedAt: toIsoNullable(data.consumedAt),
  };
  return InvitationSchema.parse(normalized);
}

/**
 * Convert a Firestore roll snapshot to the validated wire-shape `RollRecord`.
 * Mirrors `firestoreToCharacter` — duck-typed via `SnapshotLike` so it works
 * with both Admin and Client SDK snapshots. Throws if the doc has drifted
 * from `RollRecordSchema`; callers in history surfaces should swallow the
 * error and skip the row so one bad record cannot break the whole list.
 */
export function firestoreToRollRecord(snap: SnapshotLike): RollRecord {
  const data = snap.data();
  if (!data) {
    throw new Error(`Roll ${snap.id} not found.`);
  }
  // Legacy roll records (pre-prompt 20) wrote resolved.statuses without
  // a `location` field. Inject `{ kind: "character" }` so the schema parses.
  const resolved = (data.resolved as Record<string, unknown> | undefined) ?? {};
  const resolvedStatuses = Array.isArray(resolved.statuses)
    ? (resolved.statuses as Array<Record<string, unknown>>).map((s) =>
        s.location ? s : { ...s, location: { kind: "character" } },
      )
    : [];
  return RollRecordSchema.parse({
    ...data,
    id: snap.id,
    createdAt: toIso(data.createdAt),
    resolved: {
      ...resolved,
      statuses: resolvedStatuses,
    },
  });
}

/**
 * Convert a Firestore challenge snapshot (subcollection
 * `campaigns/{cid}/challenges/{id}`) to the validated wire-shape `Challenge`.
 * Mirrors the other firestoreTo* helpers.
 */
export function firestoreToChallenge(snap: SnapshotLike): Challenge {
  const data = snap.data();
  if (!data) {
    throw new Error(`Challenge ${snap.id} not found.`);
  }
  return ChallengeSchema.parse({
    ...data,
    id: snap.id,
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  });
}

/**
 * Convert a Firestore session-log snapshot (subcollection
 * `campaigns/{cid}/sessionLog/{eid}`) to the validated wire-shape
 * `SessionLogEntry`. Mirrors the other firestoreTo* helpers.
 */
/**
 * Convert a Firestore engaged-challenge mirror snapshot
 * (`campaigns/{cid}/engagedChallenges/{cid}`) to the validated wire shape.
 * Mirrors carry only the player-visible subset; status/limit/threat/notes
 * stay on the GM-only source doc.
 */
export function firestoreToEngagedChallenge(snap: SnapshotLike): EngagedChallenge {
  const data = snap.data();
  if (!data) {
    throw new Error(`EngagedChallenge ${snap.id} not found.`);
  }
  return EngagedChallengeSchema.parse({
    ...data,
    id: snap.id,
    updatedAt: toIso(data.updatedAt),
  });
}

/**
 * Convert a Firestore pendingThreat snapshot
 * (`campaigns/{cid}/pendingThreats/{ptId}`) to the validated wire shape.
 */
/**
 * Convert a Firestore session snapshot
 * (`campaigns/{cid}/sessions/{sid}`) to the validated wire shape.
 */
export function firestoreToSession(snap: SnapshotLike): Session {
  const data = snap.data();
  if (!data) {
    throw new Error(`Session ${snap.id} not found.`);
  }
  return SessionSchema.parse({
    ...data,
    id: snap.id,
    startedAt: toIso(data.startedAt),
    endedAt: data.endedAt ? toIso(data.endedAt) : null,
  });
}

export function firestoreToPendingThreat(snap: SnapshotLike): PendingThreat {
  const data = snap.data();
  if (!data) {
    throw new Error(`PendingThreat ${snap.id} not found.`);
  }
  return PendingThreatSchema.parse({
    ...data,
    id: snap.id,
    createdAt: toIso(data.createdAt),
    resolvedAt: data.resolvedAt ? toIso(data.resolvedAt) : null,
  });
}

/**
 * Convert a Firestore userSettings snapshot (`userSettings/{uid}`) to the
 * validated wire shape. Returns null when the doc doesn't exist — caller
 * supplies defaults.
 */
export function firestoreToUserSettings(
  snap: SnapshotLike,
): UserSettings | null {
  const data = snap.data();
  if (!data) return null;
  return UserSettingsSchema.parse({
    ...data,
    uid: snap.id,
    updatedAt: data.updatedAt ? toIso(data.updatedAt) : null,
  });
}

/**
 * Convert a Firestore presence snapshot (`presence/{uid}`) to the validated
 * wire shape. Returns null when the doc doesn't exist — many users won't
 * have a presence doc until their first heartbeat lands.
 */
export function firestoreToPresence(snap: SnapshotLike): PresenceDoc | null {
  const data = snap.data();
  if (!data) return null;
  return PresenceDocSchema.parse({
    ...data,
    uid: snap.id,
    lastSeenAt: toIso(data.lastSeenAt),
  });
}

export function firestoreToSessionLogEntry(snap: SnapshotLike): SessionLogEntry {
  const data = snap.data();
  if (!data) {
    throw new Error(`Session log entry ${snap.id} not found.`);
  }
  return SessionLogEntrySchema.parse({
    ...data,
    id: snap.id,
    createdAt: toIso(data.createdAt),
  });
}
