import * as React from "react";
import { Flame, Leaf, Sparkles, Thorn } from "./tag-pill-icons";
import { cn } from "@/shared/lib/cn";

export type TagPolarity =
  | "power"
  | "weakness"
  | "story-helpful"
  | "story-hindering";

export type TagState = "active" | "scratched" | "burned";

export interface TagPillProps {
  polarity: TagPolarity;
  label: string;
  state?: TagState;
  className?: string;
}

const polarityClasses: Record<TagPolarity, string> = {
  power:
    "bg-tag-power-soft text-tag-power-text border border-tag-power-base/40 " +
    "dark:bg-tag-power-soft-dark dark:text-tag-power-text-dark dark:border-tag-power-base/60",
  weakness:
    "bg-tag-weakness-soft text-tag-weakness-text border border-tag-weakness-base/40 " +
    "dark:bg-tag-weakness-soft-dark dark:text-tag-weakness-text-dark dark:border-tag-weakness-base/60",
  "story-helpful":
    "bg-tag-story-helpful text-tag-power-text border border-tag-power-base/30 " +
    "dark:bg-tag-power-soft-dark dark:text-tag-power-text-dark dark:border-tag-power-base/50",
  "story-hindering":
    "bg-tag-story-hindering text-tag-weakness-text border border-tag-weakness-base/30 " +
    "dark:bg-tag-weakness-soft-dark dark:text-tag-weakness-text-dark dark:border-tag-weakness-base/50",
};

const ariaPolarity: Record<TagPolarity, string> = {
  power: "power tag",
  weakness: "weakness tag",
  "story-helpful": "helpful story tag",
  "story-hindering": "hindering story tag",
};

function PolarityIcon({ polarity }: { polarity: TagPolarity }) {
  if (polarity === "power" || polarity === "story-helpful") {
    return <Sparkles className="h-4 w-4" aria-hidden="true" />;
  }
  return <Thorn className="h-4 w-4" aria-hidden="true" />;
}

export function TagPill({
  polarity,
  label,
  state = "active",
  className,
}: TagPillProps) {
  const stateClass =
    state === "scratched"
      ? "line-through opacity-60"
      : state === "burned"
        ? "opacity-40 italic border-dashed"
        : "";

  return (
    <span
      role="status"
      aria-label={`${ariaPolarity[polarity]}: ${label}${
        state === "scratched"
          ? ", scratched"
          : state === "burned"
            ? ", burned"
            : ""
      }`}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium leading-none",
        polarityClasses[polarity],
        stateClass,
        className,
      )}
    >
      <PolarityIcon polarity={polarity} />
      <span>{label}</span>
      {state === "burned" ? (
        <Flame className="h-4 w-4" aria-hidden="true" />
      ) : state === "scratched" ? (
        <Leaf className="h-4 w-4 opacity-50" aria-hidden="true" />
      ) : null}
    </span>
  );
}
