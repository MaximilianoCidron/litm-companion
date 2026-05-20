import { CharacterSchema, type Character } from "../schemas";

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
    createdAt: toIso(data.createdAt),
    updatedAt: toIso(data.updatedAt),
  });
}
