"use client";
import * as React from "react";
import { cn } from "@/shared/lib/cn";

export type StatusPolarity = "helpful" | "hindering";
export type StatusTier = 1 | 2 | 3 | 4 | 5 | 6;

export interface StatusTierBarProps {
  tier: StatusTier;
  polarity: StatusPolarity;
  label: string;
  onChange?: (next: StatusTier) => void;
  className?: string;
}

const polarityClasses = {
  helpful: {
    empty: "bg-moss-soft dark:bg-moss-soft-dark",
    filled: "bg-moss dark:bg-moss-dark",
    text: "text-moss-text dark:text-moss-text-dark",
  },
  hindering: {
    empty: "bg-rust-soft dark:bg-rust-soft-dark",
    filled: "bg-rust dark:bg-rust-dark",
    text: "text-rust-text dark:text-rust-text-dark",
  },
} as const;

export function StatusTierBar({
  tier,
  polarity,
  label,
  onChange,
  className,
}: StatusTierBarProps) {
  const palette = polarityClasses[polarity];
  const interactive = typeof onChange === "function";

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        className,
      )}
      role="group"
      aria-label={`${label}, ${polarity} status tier ${tier} of 6`}
    >
      <span className={cn("text-sm font-medium", palette.text)}>{label}</span>
      <div className="flex gap-1">
        {([1, 2, 3, 4, 5, 6] as const).map((n) => {
          const isFilled = n <= tier;
          const base = cn(
            "h-11 flex-1 min-w-11 inline-flex items-center justify-center rounded font-display text-sm numeric",
            isFilled
              ? cn(palette.filled, "text-parchment-elevated")
              : cn(palette.empty, palette.text),
          );
          if (interactive) {
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                aria-pressed={isFilled}
                aria-label={`Set tier ${n}`}
                className={cn(
                  base,
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                )}
              >
                {n}
              </button>
            );
          }
          return (
            <span key={n} className={base} aria-hidden="true">
              {n}
            </span>
          );
        })}
      </div>
    </div>
  );
}
