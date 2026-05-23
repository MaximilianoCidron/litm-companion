"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  LimitId,
  MutateChallengeInput,
  StatusId,
  TagId,
  ThreatId,
  type Challenge,
  type ChallengeLimit,
  type ChallengeTag,
  type ChallengeThreat,
  type Status,
} from "../schemas";
import { requireCampaignGm } from "../lib/access";
import { firestoreToChallenge } from "../lib/serialize";

const STATUS_LIMIT = 20;
const TAG_LIMIT = 20;
const LIMIT_LIMIT = 10;
const THREAT_LIMIT = 20;

interface MutateChallengeResult {
  challengeId: string;
  kind: MutateChallengeInput["op"]["kind"];
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

export const mutateChallenge = withAction(
  MutateChallengeInput,
  async (input, ctx): Promise<MutateChallengeResult> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      await requireCampaignGm(input.campaignId, ctx.uid, tx);
      const ref = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("challenges")
        .doc(input.challengeId);
      const snap = await tx.get(ref);
      if (!snap.exists) {
        throw new ActionError("NOT_FOUND", "Challenge not found.");
      }
      const challenge = firestoreToChallenge(snap);
      const op = input.op;

      const next: Challenge = {
        ...challenge,
        tags: [...challenge.tags],
        statuses: [...challenge.statuses],
        limits: [...challenge.limits],
        threats: [...challenge.threats],
      };

      switch (op.kind) {
        case "setName":
          next.name = op.name;
          break;
        case "setConcept":
          next.concept = op.concept;
          break;
        case "setRole":
          next.role = op.role;
          break;
        case "setMightLevel":
          next.mightLevel = op.mightLevel;
          break;
        case "setNotes":
          next.notes = op.notes;
          break;

        case "addTag": {
          if (next.tags.length >= TAG_LIMIT) {
            throw new ActionError("INVALID_STATE", "Tag limit reached.");
          }
          const tag: ChallengeTag = {
            id: TagId.parse(crypto.randomUUID()),
            name: op.name,
            polarity: op.polarity,
            scratched: false,
          };
          next.tags = [...next.tags, tag];
          break;
        }
        case "removeTag": {
          const after = next.tags.filter((t) => t.id !== op.tagId);
          if (after.length === next.tags.length) {
            throw new ActionError("NOT_FOUND", "Tag not found.");
          }
          next.tags = after;
          break;
        }
        case "renameTag": {
          const idx = next.tags.findIndex((t) => t.id === op.tagId);
          if (idx < 0) throw new ActionError("NOT_FOUND", "Tag not found.");
          next.tags[idx] = { ...next.tags[idx]!, name: op.name };
          break;
        }
        case "toggleTagScratch": {
          const idx = next.tags.findIndex((t) => t.id === op.tagId);
          if (idx < 0) throw new ActionError("NOT_FOUND", "Tag not found.");
          next.tags[idx] = {
            ...next.tags[idx]!,
            scratched: !next.tags[idx]!.scratched,
          };
          break;
        }

        case "addStatus": {
          if (next.statuses.length >= STATUS_LIMIT) {
            throw new ActionError("INVALID_STATE", "Status limit reached.");
          }
          const status: Status = {
            id: StatusId.parse(crypto.randomUUID()),
            name: op.name,
            tier: op.tier as Status["tier"],
            polarity: op.polarity,
          };
          next.statuses = [...next.statuses, status];
          break;
        }
        case "removeStatus": {
          const after = next.statuses.filter((s) => s.id !== op.statusId);
          if (after.length === next.statuses.length) {
            throw new ActionError("NOT_FOUND", "Status not found.");
          }
          next.statuses = after;
          break;
        }
        case "setStatusTier": {
          const idx = next.statuses.findIndex((s) => s.id === op.statusId);
          if (idx < 0) throw new ActionError("NOT_FOUND", "Status not found.");
          next.statuses[idx] = {
            ...next.statuses[idx]!,
            tier: op.tier as Status["tier"],
          };
          break;
        }
        case "renameStatus": {
          const idx = next.statuses.findIndex((s) => s.id === op.statusId);
          if (idx < 0) throw new ActionError("NOT_FOUND", "Status not found.");
          next.statuses[idx] = { ...next.statuses[idx]!, name: op.name };
          break;
        }

        case "addLimit": {
          if (next.limits.length >= LIMIT_LIMIT) {
            throw new ActionError("INVALID_STATE", "Limit limit reached.");
          }
          const limit: ChallengeLimit = {
            id: LimitId.parse(crypto.randomUUID()),
            label: op.label,
            threshold: op.threshold,
            current: 0,
          };
          next.limits = [...next.limits, limit];
          break;
        }
        case "removeLimit": {
          const after = next.limits.filter((l) => l.id !== op.limitId);
          if (after.length === next.limits.length) {
            throw new ActionError("NOT_FOUND", "Limit not found.");
          }
          next.limits = after;
          break;
        }
        case "renameLimit": {
          const idx = next.limits.findIndex((l) => l.id === op.limitId);
          if (idx < 0) throw new ActionError("NOT_FOUND", "Limit not found.");
          next.limits[idx] = { ...next.limits[idx]!, label: op.label };
          break;
        }
        case "updateLimitThreshold": {
          const idx = next.limits.findIndex((l) => l.id === op.limitId);
          if (idx < 0) throw new ActionError("NOT_FOUND", "Limit not found.");
          const current = next.limits[idx]!.current;
          next.limits[idx] = {
            ...next.limits[idx]!,
            threshold: op.threshold,
            current: clamp(current, 0, op.threshold),
          };
          break;
        }
        case "updateLimitCurrent": {
          const idx = next.limits.findIndex((l) => l.id === op.limitId);
          if (idx < 0) throw new ActionError("NOT_FOUND", "Limit not found.");
          const limit = next.limits[idx]!;
          // Silent clamp — GM mashing buttons past either bound is a no-op.
          next.limits[idx] = {
            ...limit,
            current: clamp(limit.current + op.delta, 0, limit.threshold),
          };
          break;
        }

        case "addThreat": {
          if (next.threats.length >= THREAT_LIMIT) {
            throw new ActionError("INVALID_STATE", "Threat limit reached.");
          }
          const threat: ChallengeThreat = {
            id: ThreatId.parse(crypto.randomUUID()),
            description: op.description,
            consequenceTemplate: op.consequenceTemplate,
          };
          next.threats = [...next.threats, threat];
          break;
        }
        case "removeThreat": {
          const after = next.threats.filter((t) => t.id !== op.threatId);
          if (after.length === next.threats.length) {
            throw new ActionError("NOT_FOUND", "Threat not found.");
          }
          next.threats = after;
          break;
        }
        case "updateThreat": {
          const idx = next.threats.findIndex((t) => t.id === op.threatId);
          if (idx < 0) throw new ActionError("NOT_FOUND", "Threat not found.");
          next.threats[idx] = {
            ...next.threats[idx]!,
            description: op.description,
            consequenceTemplate: op.consequenceTemplate,
          };
          break;
        }
      }

      tx.update(ref, {
        name: next.name,
        concept: next.concept,
        role: next.role,
        mightLevel: next.mightLevel,
        notes: next.notes,
        tags: next.tags,
        statuses: next.statuses,
        limits: next.limits,
        threats: next.threats,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { challengeId: input.challengeId, kind: op.kind };
    });
  },
);
