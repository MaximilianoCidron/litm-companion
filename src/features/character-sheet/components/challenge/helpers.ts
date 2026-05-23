import { CHALLENGE_ROLE_DESCRIPTIONS } from "../../schemas";
import type {
  ChallengeRole,
  ConsequenceTemplate,
  MightLevel,
} from "../../schemas";

const ROLE_LABEL: Record<ChallengeRole, string> = {
  aggressor: "Aggressor",
  charge: "Charge",
  countdown: "Countdown",
  influence: "Influence",
  mystery: "Mystery",
  obstacle: "Obstacle",
  pursuer: "Pursuer",
  quarry: "Quarry",
  sapper: "Sapper",
  support: "Support",
  watcher: "Watcher",
};

const MIGHT_LABEL: Record<MightLevel, string> = {
  origin: "Origin",
  adventure: "Adventure",
  greatness: "Greatness",
};

export function formatRole(role: ChallengeRole): string {
  return ROLE_LABEL[role];
}

export function formatRoleDescription(role: ChallengeRole): string {
  return CHALLENGE_ROLE_DESCRIPTIONS[role];
}

export function formatMight(level: MightLevel): string {
  return MIGHT_LABEL[level];
}

export function formatConsequenceTemplate(t: ConsequenceTemplate): string {
  if (t.kind === "applyStatus") {
    return `Apply ${t.statusName}-${t.tier} (${t.polarity})`;
  }
  if (t.kind === "markTrack") {
    const sign = t.delta > 0 ? "+" : "";
    return `Mark ${t.track} (${sign}${t.delta})`;
  }
  if (t.kind === "scratchTag") {
    return t.hint ? `Scratch a tag — ${t.hint}` : "Scratch a tag";
  }
  return `Custom: "${t.description}"`;
}

export function buildDeliverySuccessMessage(payload: {
  consequenceKind: ConsequenceTemplate["kind"];
  target: { characterName: string };
  details: Record<string, unknown>;
}): string {
  const { consequenceKind, target, details } = payload;
  if (consequenceKind === "applyStatus") {
    const statusName = String(details.statusName ?? "Status");
    const tier = Number(details.tier ?? 0);
    return `${statusName}-${tier} applied to ${target.characterName}`;
  }
  if (consequenceKind === "markTrack") {
    const themeName = String(details.themeName ?? "theme");
    const track = String(details.track ?? "track");
    const delta = Number(details.delta ?? 0);
    const sign = delta > 0 ? "+1" : "−1";
    return `${capitalize(track)} marked on ${themeName} of ${target.characterName} (${sign})`;
  }
  if (consequenceKind === "scratchTag") {
    const tagName = String(details.tagName ?? "tag");
    return `"${tagName}" scratched on ${target.characterName}`;
  }
  const description = String(details.description ?? "");
  const truncated =
    description.length > 40 ? `${description.slice(0, 40)}…` : description;
  return `Consequence delivered: "${truncated}"`;
}

function capitalize(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}
