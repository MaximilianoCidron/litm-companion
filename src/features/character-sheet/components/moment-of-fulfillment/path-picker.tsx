"use client";

import { cn } from "@/shared/lib/cn";
import type { MomentOfFulfillmentPath } from "../../schemas";
import { PATHS } from "./helpers";

interface PathPickerProps {
  value: MomentOfFulfillmentPath | null;
  onChange: (next: MomentOfFulfillmentPath) => void;
}

export function PathPicker({ value, onChange }: PathPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Pick a path"
      className="flex flex-col gap-2"
    >
      {PATHS.map(({ key, label, description, Icon }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={cn(
              "flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
              active
                ? "border-ember bg-ember/10"
                : "border-mist-light bg-parchment-elevated hover:bg-parchment-soft dark:border-mist-dark dark:bg-ink-elevated dark:hover:bg-ink-soft",
            )}
          >
            <Icon
              className="mt-0.5 h-5 w-5 shrink-0 text-ember"
              aria-hidden="true"
            />
            <div className="flex flex-col gap-0.5">
              <span className="font-display text-base text-ink-base dark:text-parchment-base">
                {label}
              </span>
              <span className="text-sm text-ink-muted dark:text-parchment-muted">
                {description}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
