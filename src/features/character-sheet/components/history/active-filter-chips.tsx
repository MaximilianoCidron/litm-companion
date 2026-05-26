"use client";

import { X } from "lucide-react";
import { emptyFilters, type HistoryFilters } from "../../lib/history-filter";
import type { Theme } from "../../schemas/theme";

interface ActiveFilterChipsProps {
  filters: HistoryFilters;
  onFiltersChange: (next: HistoryFilters) => void;
  themes: readonly Theme[];
}

interface Chip {
  key: string;
  label: string;
  clear: () => void;
}

const PRESET_LABEL: Record<HistoryFilters["datePreset"], string> = {
  any: "",
  "past-week": "Past week",
  "past-month": "Past month",
  "past-3-months": "Past 3 months",
  "past-year": "Past year",
  custom: "Custom range",
};

const ROLE_LABEL: Record<HistoryFilters["roleFilter"], string> = {
  all: "",
  "rolls-only": "Rolls only",
  "reactions-only": "Reactions only",
  "detailed-only": "Detailed actions only",
};

function titleCase(s: string): string {
  return s.length === 0 ? s : s[0]!.toUpperCase() + s.slice(1);
}

export function ActiveFilterChips({
  filters,
  onFiltersChange,
  themes,
}: ActiveFilterChipsProps) {
  const chips: Chip[] = [];

  if (filters.text.length > 0) {
    chips.push({
      key: "text",
      label: `"${filters.text}"`,
      clear: () => onFiltersChange({ ...filters, text: "" }),
    });
  }

  for (const tier of filters.tiers) {
    chips.push({
      key: `tier-${tier}`,
      label: titleCase(tier),
      clear: () => {
        const next = new Set(filters.tiers);
        next.delete(tier);
        onFiltersChange({ ...filters, tiers: next });
      },
    });
  }

  if (filters.roleFilter !== "all") {
    chips.push({
      key: "role",
      label: ROLE_LABEL[filters.roleFilter],
      clear: () => onFiltersChange({ ...filters, roleFilter: "all" }),
    });
  }

  for (const themeId of filters.themeIds) {
    const theme = themes.find((t) => t.id === themeId);
    if (!theme) continue;
    chips.push({
      key: `theme-${themeId}`,
      label: theme.name.trim() || "Untitled theme",
      clear: () => {
        const next = new Set(filters.themeIds);
        next.delete(themeId);
        onFiltersChange({ ...filters, themeIds: next });
      },
    });
  }

  if (filters.datePreset !== "any") {
    chips.push({
      key: "date",
      label: PRESET_LABEL[filters.datePreset],
      clear: () =>
        onFiltersChange({
          ...filters,
          datePreset: "any",
          customDateFrom: null,
          customDateTo: null,
        }),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <span
          key={c.key}
          className="inline-flex items-center gap-1 rounded-full border border-ember/30 bg-ember/15 py-0.5 pl-2.5 pr-1 text-xs text-ember-text-light dark:bg-ember/20 dark:text-ember-text-dark"
        >
          {c.label}
          <button
            type="button"
            onClick={c.clear}
            aria-label={`Remove filter ${c.label}`}
            className="inline-flex h-5 w-5 items-center justify-center rounded-full hover:bg-ember/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={() => onFiltersChange(emptyFilters())}
        className="text-xs text-ink-muted underline-offset-2 hover:text-ember hover:underline dark:text-parchment-muted"
      >
        Clear all
      </button>
    </div>
  );
}
