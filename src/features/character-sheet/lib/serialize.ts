import {
  CampaignSchema,
  CharacterSchema,
  InvitationSchema,
  type Campaign,
  type Character,
  type Invitation,
} from "../schemas";

type TimestampLike = { toDate(): Date };

function toIso(value: unknown): string {
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
  return CharacterSchema.parse({
    ...data,
    id: snap.id,
    fellowship: migrateRelationships(data.fellowship),
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  });
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
  return InvitationSchema.parse({
    ...data,
    id: snap.id,
    createdAt: toIso(data.createdAt),
    expiresAt: toIso(data.expiresAt),
    consumedAt: toIsoNullable(data.consumedAt),
  });
}
