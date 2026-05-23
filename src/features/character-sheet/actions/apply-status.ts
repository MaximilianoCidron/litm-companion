"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { ApplyStatusInput } from "../schemas";
import { assertNotRetired, requireCharacterAccess } from "../lib/access";

type StatusDoc = {
  id: string;
  name: string;
  tier: number;
  polarity: "helpful" | "hindering";
};

interface ApplyStatusResult {
  statusId: string;
  removed?: boolean;
  tier?: number;
  name?: string;
}

const MAX_STATUSES = 20;
const TIER_CAP = 6;

export const applyStatus = withAction(
  ApplyStatusInput,
  async (input, ctx): Promise<ApplyStatusResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const access = await requireCharacterAccess(
        input.characterId,
        ctx.uid,
        tx,
      );

      const data = access.snap.data() ?? {};
      assertNotRetired(data); // retired-character guard
      const statuses: StatusDoc[] = Array.isArray(data.statuses)
        ? [...data.statuses]
        : [];

      let result: ApplyStatusResult;
      let next: StatusDoc[];

      if (input.status.kind === "add") {
        if (statuses.length >= MAX_STATUSES) {
          throw new ActionError(
            "INVALID_STATE",
            "Status list is at the limit.",
          );
        }
        const newId = crypto.randomUUID();
        const newStatus: StatusDoc = {
          id: newId,
          name: input.status.name,
          tier: input.status.tier,
          polarity: input.status.polarity,
        };
        next = [...statuses, newStatus];
        result = {
          statusId: newId,
          tier: newStatus.tier,
          name: newStatus.name,
        };
      } else if (input.status.kind === "setTier") {
        const patch = input.status;
        const idx = statuses.findIndex((s) => s.id === patch.statusId);
        if (idx === -1) {
          throw new ActionError("NOT_FOUND", "Status not found.");
        }
        const updated: StatusDoc = {
          ...statuses[idx]!,
          tier: Math.min(patch.tier, TIER_CAP),
        };
        next = statuses.map((s, i) => (i === idx ? updated : s));
        result = { statusId: updated.id, tier: updated.tier };
      } else if (input.status.kind === "rename") {
        const patch = input.status;
        const idx = statuses.findIndex((s) => s.id === patch.statusId);
        if (idx === -1) {
          throw new ActionError("NOT_FOUND", "Status not found.");
        }
        const updated: StatusDoc = {
          ...statuses[idx]!,
          name: patch.name,
        };
        next = statuses.map((s, i) => (i === idx ? updated : s));
        result = { statusId: updated.id, name: updated.name };
      } else {
        const patch = input.status;
        const idx = statuses.findIndex((s) => s.id === patch.statusId);
        if (idx === -1) {
          throw new ActionError("NOT_FOUND", "Status not found.");
        }
        next = statuses.filter((_, i) => i !== idx);
        result = { statusId: patch.statusId, removed: true };
      }

      tx.update(access.snap.ref, {
        statuses: next,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return result;
    });
  },
);
