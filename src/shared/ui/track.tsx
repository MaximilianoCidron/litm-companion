"use client";
import * as React from "react";
import { cn } from "@/shared/lib/cn";

export interface TrackProps {
  total: 3 | 5;
  filled: number;
  label?: string;
  /**
   * Atomic ±1 step. Called with -1 when the user clicks the last filled pip,
   * +1 when they click the next empty pip. Only those two pips are clickable.
   * Omit to render read-only.
   */
  onChange?: (delta: -1 | 1) => void;
  disabled?: boolean;
  className?: string;
}

export function Track({
  total,
  filled,
  label,
  onChange,
  disabled = false,
  className,
}: TrackProps) {
  const clamped = Math.max(0, Math.min(total, filled));
  const interactive = typeof onChange === "function" && !disabled;
  const pipSize = total === 5 ? "h-4 w-4" : "h-3 w-3";

  const nextEmptyIdx = clamped < total ? clamped : -1;
  const lastFilledIdx = clamped > 0 ? clamped - 1 : -1;

  const ariaLabel = label
    ? `${label} track, ${clamped} of ${total} marked`
    : `${clamped} of ${total} marked`;

  return (
    <div
      className={cn(
        "flex flex-col gap-1",
        disabled && "opacity-60",
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      {label ? (
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          {label}
        </span>
      ) : null}
      <div className="flex items-center gap-2">
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => {
            const isFilled = i < clamped;
            const isNextEmpty = i === nextEmptyIdx;
            const isLastFilled = i === lastFilledIdx;
            const clickable = interactive && (isNextEmpty || isLastFilled);

            const base = cn(
              "rounded-full transition-colors",
              pipSize,
              isFilled
                ? "bg-ember"
                : "border border-mist-light bg-transparent dark:border-mist-dark",
            );

            if (clickable) {
              const delta: -1 | 1 = isNextEmpty ? 1 : -1;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onChange?.(delta)}
                  aria-pressed={isFilled}
                  aria-label={
                    delta === 1 ? `Mark ${i + 1}` : `Unmark ${i + 1}`
                  }
                  className={cn(
                    base,
                    "cursor-pointer hover:ring-2 hover:ring-ember/40",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                  )}
                />
              );
            }

            // Non-clickable pip — slightly desaturated when track is interactive
            // but this particular pip is between the endpoints.
            return (
              <span
                key={i}
                className={cn(
                  base,
                  interactive && !isFilled && "opacity-60",
                  "pointer-events-none",
                )}
                aria-hidden="true"
              />
            );
          })}
        </div>
        <span className="numeric ml-1 text-xs text-ink-subtle dark:text-parchment-subtle">
          {clamped}/{total}
        </span>
      </div>
    </div>
  );
}
