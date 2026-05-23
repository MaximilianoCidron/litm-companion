import "server-only";
import { FieldValue } from "firebase-admin/firestore";
import type { Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import type { AuthContext } from "@/shared/auth";
import type { SessionLogDetails } from "../schemas";

export interface LogEntryPayload {
  campaignId: string;
  authorUid: string;
  authorName: string;
  subjectCharacterId: string | null;
  subjectCharacterName: string | null;
  text: string;
  details: SessionLogDetails;
}

/**
 * Single source of truth for writing session-log entries. Every auto-emitting
 * action goes through this so the shape stays consistent. Must be called
 * inside the action's existing transaction so the log write commits or rolls
 * back atomically with the originating mutation.
 */
export function writeLogEntry(
  tx: Transaction,
  payload: LogEntryPayload,
): { entryId: string } {
  const db = getAdminDb();
  const ref = db
    .collection("campaigns")
    .doc(payload.campaignId)
    .collection("sessionLog")
    .doc();
  tx.set(ref, {
    id: ref.id,
    campaignId: payload.campaignId,
    authorUid: payload.authorUid,
    authorName: payload.authorName,
    subjectCharacterId: payload.subjectCharacterId,
    subjectCharacterName: payload.subjectCharacterName,
    text: payload.text,
    details: payload.details,
    pinned: false,
    createdAt: FieldValue.serverTimestamp(),
  });
  return { entryId: ref.id };
}

export function getAuthorDisplayName(ctx: AuthContext): string {
  return (
    (ctx.displayName && ctx.displayName.trim()) ||
    (ctx.email && ctx.email.trim()) ||
    "Unknown"
  );
}

export function summarizeCampActivity(
  characterName: string,
  activity: "rest" | "reflect" | "campAction",
  reflectThemeName?: string,
  campActionDescription?: string,
): string {
  if (activity === "rest") return `${characterName} rested.`;
  if (activity === "reflect") {
    return `${characterName} reflected on ${reflectThemeName ?? "a theme"}.`;
  }
  const desc = (campActionDescription ?? "").trim();
  return desc
    ? `${characterName} took a camp action: ${desc}`
    : `${characterName} took a camp action.`;
}

export interface ConsequenceLogDetails {
  statusName?: string;
  tier?: number;
  polarity?: string;
  track?: string;
  delta?: number;
  tagName?: string;
  customDescription?: string;
}

export function summarizeThreatDelivery(
  targetName: string,
  consequenceKind: "applyStatus" | "markTrack" | "scratchTag" | "custom",
  details: ConsequenceLogDetails,
): string {
  switch (consequenceKind) {
    case "applyStatus":
      return `A consequence was applied to ${targetName}: ${details.statusName}-${details.tier} ${details.polarity}.`;
    case "markTrack": {
      const sign = (details.delta ?? 0) > 0 ? "+1" : "−1";
      return `A consequence marked ${targetName}'s ${details.track} track (${sign}).`;
    }
    case "scratchTag":
      return `A consequence scratched "${details.tagName}" on ${targetName}.`;
    case "custom":
      return `A consequence was delivered: ${details.customDescription ?? ""}.`;
  }
}

const MOF_PATH_LABELS: Record<string, string> = {
  retire: "retired their hero",
  reforge: "reforged their hero",
  gainQuintessence: "gained a quintessence",
  shakeWorld: "shook the foundations",
  speakWordsEternal: "spoke words eternal",
  unearthTruths: "unearthed lost truths",
};

export function summarizeMomentOfFulfillment(
  characterName: string,
  path: string,
  burnedTagsRestored: number,
): string {
  const base = `${characterName} ${
    MOF_PATH_LABELS[path] ?? "reached a Moment of Fulfillment"
  }.`;
  return burnedTagsRestored > 0
    ? `${base} ${burnedTagsRestored} burned tag${
        burnedTagsRestored > 1 ? "s" : ""
      } restored.`
    : base;
}

export interface ReactionResolutionSummary {
  targetName: string;
  consequenceKind: "applyStatus" | "scratchTag";
  // applyStatus fields
  statusName?: string;
  originalTier?: number;
  finalTier?: number;
  polarity?: string;
  // scratchTag fields
  tagName?: string;
  // outcome
  outcome:
    | "acceptedFull"
    | "tierReduction"
    | "tagPreserved"
    | "tagScratched";
  powerSpent?: number;
}

export function summarizeReactionResolution(s: ReactionResolutionSummary): string {
  if (s.consequenceKind === "applyStatus") {
    const status = s.statusName ?? "status";
    const polarity = s.polarity ?? "";
    if (s.outcome === "acceptedFull") {
      const tier = s.originalTier ?? 0;
      return `${s.targetName} took ${status}-${tier} ${polarity} — declined to react.`;
    }
    if (s.outcome === "tierReduction") {
      const original = s.originalTier ?? 0;
      const finalTier = s.finalTier ?? 0;
      const spent = s.powerSpent ?? 0;
      if (finalTier === 0) {
        return `${s.targetName}'s Reaction fully prevented the ${status}-${original} — ${spent} tier${spent === 1 ? "" : "s"} reduced.`;
      }
      return `${s.targetName} took ${status}-${finalTier} ${polarity} — Reaction reduced from ${status}-${original} (spent ${spent} Power).`;
    }
  }
  // scratchTag
  const tag = s.tagName ?? "tag";
  if (s.outcome === "tagPreserved") {
    return `${s.targetName} preserved "${tag}" from being scratched (spent 2 Power).`;
  }
  if (s.outcome === "tagScratched") {
    return `${s.targetName} lost "${tag}" to a scratch — declined preservation.`;
  }
  return `${s.targetName} took the consequence.`;
}

export function summarizeThemeAdvancement(
  characterName: string,
  kind: "evolve" | "replace",
  themeName: string,
  newMightLevel?: string,
): string {
  if (kind === "evolve") {
    return `${characterName}'s "${themeName}" theme evolved${
      newMightLevel ? ` to ${newMightLevel}` : ""
    }.`;
  }
  return `${characterName} replaced their "${themeName}" theme.`;
}
