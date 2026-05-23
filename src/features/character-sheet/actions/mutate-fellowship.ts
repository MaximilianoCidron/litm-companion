// TODO(refactor): promote campaign subdomain to its own feature.
"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import {
  MutateFellowshipInput,
  PowerTagSchema,
  TagId,
  type FellowshipTheme,
  type PowerTag,
} from "../schemas";
import { requireCampaignGm } from "../lib/access";
import { firestoreToCampaign } from "../lib/serialize";

const POWER_TAG_LIMIT = 12;
const IMPROVEMENT_LIMIT = 12;

interface MutateFellowshipResult {
  campaignId: string;
  kind: MutateFellowshipInput["op"]["kind"];
}

export const mutateFellowship = withAction(
  MutateFellowshipInput,
  async (input, ctx): Promise<MutateFellowshipResult> => {
    const db = getAdminDb();

    return db.runTransaction(async (tx) => {
      const { snap } = await requireCampaignGm(
        input.campaignId,
        ctx.uid,
        tx,
      );
      const campaign = firestoreToCampaign(snap);
      const fellowship: FellowshipTheme = {
        ...campaign.fellowship,
        powerTags: [...campaign.fellowship.powerTags],
        weaknessTag: { ...campaign.fellowship.weaknessTag },
        specialImprovements: [...campaign.fellowship.specialImprovements],
        tracks: { ...campaign.fellowship.tracks },
      };
      const op = input.op;

      switch (op.kind) {
        case "setName":
          fellowship.name = op.name;
          break;
        case "setQuest":
          fellowship.quest = op.quest;
          break;
        case "renameWeakness":
          fellowship.weaknessTag = {
            ...fellowship.weaknessTag,
            name: op.name,
          };
          break;
        case "addPowerTag": {
          if (fellowship.powerTags.length >= POWER_TAG_LIMIT) {
            throw new ActionError(
              "INVALID_STATE",
              "Fellowship is at the tag limit.",
            );
          }
          const tag: PowerTag = PowerTagSchema.parse({
            id: TagId.parse(crypto.randomUUID()),
            name: op.name,
            scratched: false,
            burned: false,
          });
          fellowship.powerTags = [...fellowship.powerTags, tag];
          break;
        }
        case "removePowerTag": {
          const next = fellowship.powerTags.filter((t) => t.id !== op.tagId);
          if (next.length === fellowship.powerTags.length) {
            throw new ActionError(
              "NOT_FOUND",
              "Fellowship tag not found.",
            );
          }
          fellowship.powerTags = next;
          break;
        }
        case "markTrack": {
          const current = fellowship.tracks[op.track];
          const next = Math.max(0, Math.min(3, current + op.delta));
          fellowship.tracks = { ...fellowship.tracks, [op.track]: next };
          // Advancement on track == 3 is intentionally NOT auto-triggered;
          // fellowship advancement is a party ritual landing in a later
          // prompt. UI may show a static "advancement available" indicator.
          break;
        }
        case "addImprovement": {
          if (fellowship.specialImprovements.length >= IMPROVEMENT_LIMIT) {
            throw new ActionError(
              "INVALID_STATE",
              "Fellowship is at the special improvement limit.",
            );
          }
          fellowship.specialImprovements = [
            ...fellowship.specialImprovements,
            op.text,
          ];
          break;
        }
        case "removeImprovement": {
          if (op.index >= fellowship.specialImprovements.length) {
            throw new ActionError("NOT_FOUND", "Improvement not found.");
          }
          fellowship.specialImprovements =
            fellowship.specialImprovements.filter((_, i) => i !== op.index);
          break;
        }
        case "editImprovement": {
          if (op.index >= fellowship.specialImprovements.length) {
            throw new ActionError("NOT_FOUND", "Improvement not found.");
          }
          fellowship.specialImprovements = fellowship.specialImprovements.map(
            (v, i) => (i === op.index ? op.text : v),
          );
          break;
        }
        case "refreshTags": {
          fellowship.powerTags = fellowship.powerTags.map((t) => ({
            ...t,
            scratched: false,
          }));
          break;
        }
      }

      tx.update(snap.ref, {
        fellowship,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return { campaignId: input.campaignId, kind: op.kind };
    });
  },
);
