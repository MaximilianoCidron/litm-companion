"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  FellowshipRelationshipId,
  FellowshipRelationshipSchema,
  MutateRelationshipsInput,
  type FellowshipRelationship,
} from "../schemas";
import { requireCharacterAccess } from "../lib/access";

const RELATIONSHIP_LIMIT = 10;

type RelationshipDoc = {
  id?: string;
  partnerName?: string;
  companionCharId?: string | null;
  companionName?: string;
  relationshipTag?: string;
  polarity?: "helpful" | "hindering";
};

interface MutateResult {
  relationshipId: string;
  kind: "add" | "update" | "remove";
}

function normalize(rel: RelationshipDoc): FellowshipRelationship | null {
  const id = rel.id;
  if (!id) return null;
  const companionName =
    rel.companionName && rel.companionName.length > 0
      ? rel.companionName
      : rel.partnerName && rel.partnerName.length > 0
        ? rel.partnerName
        : "Unknown";
  const polarity =
    rel.polarity === "hindering" ? "hindering" : "helpful";
  const relationshipTag =
    rel.relationshipTag && rel.relationshipTag.length > 0
      ? rel.relationshipTag
      : "ally";
  return FellowshipRelationshipSchema.parse({
    id,
    companionCharId: rel.companionCharId ?? null,
    companionName,
    relationshipTag,
    polarity,
  });
}

export const mutateRelationships = withAction(
  MutateRelationshipsInput,
  async (input, ctx): Promise<MutateResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );
      const data = access.snap.data() ?? {};
      const fellowship = (data.fellowship as Record<string, unknown>) ?? {};
      const stored = Array.isArray(fellowship.relationships)
        ? (fellowship.relationships as RelationshipDoc[])
        : [];

      const current = stored
        .map(normalize)
        .filter((r): r is FellowshipRelationship => r !== null);

      let next: FellowshipRelationship[];
      let touched: string;
      const op = input.op;

      if (op.kind === "add") {
        if (current.length >= RELATIONSHIP_LIMIT) {
          throw new ActionError(
            "INVALID_STATE",
            "Relationship limit reached.",
          );
        }
        const id = FellowshipRelationshipId.parse(crypto.randomUUID());
        const entry = FellowshipRelationshipSchema.parse({
          id,
          companionCharId: op.companionCharId,
          companionName: op.companionName,
          relationshipTag: op.relationshipTag,
          polarity: op.polarity,
        });
        next = [...current, entry];
        touched = id;
      } else if (op.kind === "update") {
        const idx = current.findIndex((r) => r.id === op.relationshipId);
        if (idx === -1) {
          throw new ActionError("NOT_FOUND", "Relationship not found.");
        }
        const prev = current[idx]!;
        const patched = FellowshipRelationshipSchema.parse({
          ...prev,
          relationshipTag: op.relationshipTag ?? prev.relationshipTag,
          polarity: op.polarity ?? prev.polarity,
        });
        next = [...current];
        next[idx] = patched;
        touched = op.relationshipId;
      } else {
        const idx = current.findIndex((r) => r.id === op.relationshipId);
        if (idx === -1) {
          throw new ActionError("NOT_FOUND", "Relationship not found.");
        }
        next = current.filter((r) => r.id !== op.relationshipId);
        touched = op.relationshipId;
      }

      tx.update(access.snap.ref, {
        "fellowship.relationships": next,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { relationshipId: touched, kind: op.kind };
    });
  },
);
