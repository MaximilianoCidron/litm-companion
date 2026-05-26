"use client";
import { cn } from "@/shared/lib/cn";
import type { MomentOfFulfillmentPath } from "../../schemas";
import { PATH_INFO } from "./path-info";

interface PathPickerProps {
  value: MomentOfFulfillmentPath | null;
  onChange: (next: MomentOfFulfillmentPath) => void;
}

const PATHS = Object.keys(PATH_INFO) as MomentOfFulfillmentPath[];

export function PathPicker({ value, onChange }: PathPickerProps) {
  return (
    <ul
      role="radiogroup"
      aria-label="Choose a Moment of Fulfillment path"
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3"
    >
      {PATHS.map((path) => {
        const info = PATH_INFO[path];
        const Icon = info.icon;
        const active = value === path;
        return (
          <li key={path}>
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(path)}
              className={cn(
                "flex h-full w-full flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember",
                active
                  ? "border-ember bg-ember/10 text-ink-base dark:text-parchment-base"
                  : "border-mist-light bg-parchment-elevated hover:border-ember/40 dark:border-mist-dark dark:bg-ink-elevated",
              )}
            >
              <span className="inline-flex items-center gap-2 font-display text-sm">
                <Icon className="h-4 w-4 text-ember" aria-hidden="true" />
                {info.label}
              </span>
              <span className="text-xs text-ink-muted dark:text-parchment-muted">
                {info.description}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
