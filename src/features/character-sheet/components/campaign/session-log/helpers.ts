import type { LucideIcon } from "lucide-react";
import {
  Flag,
  MessageSquare,
  ScrollText,
  Sparkles,
  Sword,
  Target,
  Tent,
  TrendingUp,
} from "lucide-react";
import type { SessionLogDetails, SessionLogEntry } from "../../../schemas";

export type LogFilter =
  | "all"
  | "annotation"
  | "campAction"
  | "deliverThreat"
  | "themeAdvancement"
  | "momentOfFulfillment"
  | "sessionBoundary"
  | "limitAdvancement";

export type LogFilterCounts = Record<LogFilter, number>;

export function applyFilter(
  entries: readonly SessionLogEntry[],
  filter: LogFilter,
): readonly SessionLogEntry[] {
  if (filter === "all") return entries;
  return entries.filter((e) => e.details.kind === filter);
}

export function summarizeCounts(
  entries: readonly SessionLogEntry[],
): LogFilterCounts {
  const counts: LogFilterCounts = {
    all: entries.length,
    annotation: 0,
    campAction: 0,
    deliverThreat: 0,
    themeAdvancement: 0,
    momentOfFulfillment: 0,
    sessionBoundary: 0,
    limitAdvancement: 0,
  };
  for (const e of entries) counts[e.details.kind] += 1;
  return counts;
}

interface KindMeta {
  Icon: LucideIcon;
  label: string;
  /** Left-border accent class. */
  accent: string;
  /** Badge tone class (bg + text). */
  badge: string;
}

const KIND_META: Record<SessionLogDetails["kind"], KindMeta> = {
  annotation: {
    Icon: ScrollText,
    label: "Annotation",
    accent: "border-l-4 border-mist-light dark:border-mist-dark",
    badge: "bg-mist-light text-ink-muted dark:bg-mist-dark dark:text-parchment-muted",
  },
  campAction: {
    Icon: Tent,
    label: "Camp",
    accent: "border-l-4 border-ink-muted",
    badge: "bg-ink-muted/15 text-ink-muted dark:text-parchment-muted",
  },
  deliverThreat: {
    Icon: Sword,
    label: "Threat",
    accent: "border-l-4 border-rust",
    badge: "bg-rust-soft text-rust-text dark:bg-rust-soft-dark dark:text-rust-text-dark",
  },
  themeAdvancement: {
    Icon: TrendingUp,
    label: "Advancement",
    accent: "border-l-4 border-moss",
    badge: "bg-moss-soft text-moss-text dark:bg-moss-soft-dark dark:text-moss-text-dark",
  },
  momentOfFulfillment: {
    Icon: Sparkles,
    label: "Moment",
    accent: "border-l-4 border-ember",
    badge: "bg-ember/15 text-ember-text-light dark:text-ember-text-dark",
  },
  sessionBoundary: {
    Icon: Flag,
    label: "Session",
    accent: "border-l-4 border-ember",
    badge: "bg-ember/15 text-ember-text-light dark:text-ember-text-dark",
  },
  limitAdvancement: {
    Icon: Target,
    label: "Limit progress",
    accent: "border-l-4 border-rust",
    badge: "bg-rust-soft text-rust-text dark:bg-rust-soft-dark dark:text-rust-text-dark",
  },
};

export function kindMeta(kind: SessionLogDetails["kind"]): KindMeta {
  return KIND_META[kind];
}

export const ANNOTATION_ICON = MessageSquare;
