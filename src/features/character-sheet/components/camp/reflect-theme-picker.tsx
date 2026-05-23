"use client";

import { cn } from "@/shared/lib/cn";
import type { Theme, ThemeId } from "../../schemas";

interface ReflectThemePickerProps {
  themes: readonly Theme[];
  value: ThemeId | null;
  onChange: (next: ThemeId) => void;
}

export function ReflectThemePicker({
  themes,
  value,
  onChange,
}: ReflectThemePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Pick a theme to reflect on"
      className="flex flex-col gap-2"
    >
      {themes.map((theme) => {
        const full = theme.tracks.improve >= 3;
        const isActive = value === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={isActive}
            disabled={full}
            onClick={() => onChange(theme.id)}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
              isActive
                ? "border-ember bg-ember/10 text-ink-base dark:text-parchment-base"
                : "border-mist-light bg-parchment-elevated text-ink-base hover:bg-parchment-soft dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base dark:hover:bg-ink-soft",
              full && "cursor-not-allowed opacity-60",
            )}
          >
            <div className="flex flex-col">
              <span className="font-display text-base">
                {theme.name || "Unnamed theme"}
              </span>
              <span className="text-xs text-ink-subtle dark:text-parchment-subtle">
                Improve {theme.tracks.improve}/3
                {full ? " · already ready for advancement" : ""}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
