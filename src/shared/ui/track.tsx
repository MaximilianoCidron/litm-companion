"use client";
import * as React from "react";
import { cn } from "@/shared/lib/cn";

export interface TrackProps {
  total: 3 | 5;
  filled: number;
  label?: string;
  onChange?: (next: number) => void;
  className?: string;
}

export function Track({
  total,
  filled,
  label,
  onChange,
  className,
}: TrackProps) {
  const clamped = Math.max(0, Math.min(total, filled));
  const interactive = typeof onChange === "function";
  const pipSize = total === 5 ? "h-4 w-4" : "h-3 w-3";

  const ariaLabel = label
    ? `${label} track, ${clamped} of ${total} marked`
    : `${clamped} of ${total} marked`;

  return (
    <div
      className={cn("flex items-center gap-2", className)}
      role="group"
      aria-label={ariaLabel}
    >
      {label ? (
        <span className="text-sm text-ink-muted dark:text-parchment-muted">
          {label}
        </span>
      ) : null}
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => {
          const isFilled = i < clamped;
          const base = cn(
            "rounded-full transition-colors",
            pipSize,
            isFilled
              ? "bg-ember"
              : "border border-mist-light bg-transparent dark:border-mist-dark",
          );
          if (interactive) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => onChange(isFilled ? i : i + 1)}
                aria-pressed={isFilled}
                aria-label={`Mark ${i + 1}`}
                className={cn(
                  base,
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                )}
              />
            );
          }
          return <span key={i} className={base} aria-hidden="true" />;
        })}
      </div>
      <span className="numeric ml-1 text-xs text-ink-subtle dark:text-parchment-subtle">
        {clamped}/{total}
      </span>
    </div>
  );
}
