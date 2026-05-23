"use client";

import { ChevronRight, Scale, Shield, Sparkles, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatRelativeTime } from "@/shared/lib/format";
import type { RollRecord } from "../../schemas";

interface RollListRowProps {
  roll: RollRecord;
  onOpen: () => void;
}

interface TierMeta {
  Icon: LucideIcon;
  label: string;
  tone: string;
}

function tierMeta(roll: RollRecord): TierMeta {
  if (roll.isReaction) {
    return {
      Icon: Shield,
      label: "Reaction",
      tone: "bg-ember/15 text-ember-text-light dark:text-ember-text-dark",
    };
  }
  switch (roll.tier) {
    case "success":
      return {
        Icon: Sparkles,
        label: "Success",
        tone: "bg-moss-soft text-moss-text dark:bg-moss-soft-dark dark:text-moss-text-dark",
      };
    case "mixed":
      return {
        Icon: Scale,
        label: "Mixed",
        tone: "bg-tag-power-soft text-tag-power-text dark:bg-tag-power-soft-dark dark:text-tag-power-text-dark",
      };
    case "failure":
      return {
        Icon: X,
        label: "Failure",
        tone: "bg-rust-soft text-rust-text dark:bg-rust-soft-dark dark:text-rust-text-dark",
      };
    default:
      return {
        Icon: Scale,
        label: "Unknown",
        tone: "bg-mist/15 text-ink-muted dark:text-parchment-muted",
      };
  }
}

export function RollListRow({ roll, onOpen }: RollListRowProps) {
  const { Icon, label, tone } = tierMeta(roll);
  const signedPower = roll.power >= 0 ? `+${roll.power}` : `${roll.power}`;
  const showPower = roll.power !== 0;
  const relative = formatRelativeTime(roll.createdAt);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-parchment-soft focus-visible:bg-parchment-soft focus-visible:outline-none dark:hover:bg-ink-soft dark:focus-visible:bg-ink-soft"
      aria-label={`Roll from ${relative}, ${label}, total ${roll.total}`}
    >
      <span className="numeric w-20 shrink-0 text-xs text-ink-subtle dark:text-parchment-subtle">
        {relative}
      </span>

      <span className="numeric hidden w-32 shrink-0 font-display text-sm sm:inline-block">
        {roll.d1} + {roll.d2}
        {showPower ? ` · ${signedPower}` : ""} ={" "}
        <span className="text-lg">{roll.total}</span>
      </span>

      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-display text-xs uppercase tracking-wider ${tone}`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </span>

      <span className="flex-1" />
      <ChevronRight
        className="h-4 w-4 shrink-0 text-ink-subtle dark:text-parchment-subtle"
        aria-hidden="true"
      />
    </button>
  );
}
