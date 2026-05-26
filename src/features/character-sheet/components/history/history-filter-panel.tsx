"use client";

import { cn } from "@/shared/lib/cn";
import type {
  HistoryDatePreset,
  HistoryFilters,
  HistoryRoleFilter,
} from "../../lib/history-filter";
import type { ThemeId } from "../../schemas/ids";
import type { RollTier } from "../../schemas/roll";
import type { Theme } from "../../schemas/theme";

interface HistoryFilterPanelProps {
  filters: HistoryFilters;
  onFiltersChange: (next: HistoryFilters) => void;
  themes: readonly Theme[];
}

const TIERS: ReadonlyArray<{ value: RollTier; label: string }> = [
  { value: "success", label: "Success" },
  { value: "mixed", label: "Mixed" },
  { value: "failure", label: "Failure" },
];

const ROLES: ReadonlyArray<{ value: HistoryRoleFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "rolls-only", label: "Rolls" },
  { value: "reactions-only", label: "Reactions" },
  { value: "detailed-only", label: "Detailed" },
];

const DATE_PRESETS: ReadonlyArray<{
  value: HistoryDatePreset;
  label: string;
}> = [
  { value: "any", label: "Any time" },
  { value: "past-week", label: "Past week" },
  { value: "past-month", label: "Past month" },
  { value: "past-3-months", label: "Past 3 months" },
  { value: "past-year", label: "Past year" },
  { value: "custom", label: "Custom range" },
];

const chipBase =
  "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember";
const chipInactive =
  "border-mist-light bg-transparent text-ink-base hover:border-ember/40 dark:border-mist-dark dark:text-parchment-base";
const chipActive =
  "border-ember bg-ember text-parchment-elevated hover:bg-ember-hover";

const sectionLabel =
  "mb-2 font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted";

export function HistoryFilterPanel({
  filters,
  onFiltersChange,
  themes,
}: HistoryFilterPanelProps) {
  const toggleTier = (tier: RollTier) => {
    const next = new Set(filters.tiers);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);
    onFiltersChange({ ...filters, tiers: next });
  };

  const toggleTheme = (themeId: ThemeId) => {
    const next = new Set(filters.themeIds);
    if (next.has(themeId)) next.delete(themeId);
    else next.add(themeId);
    onFiltersChange({ ...filters, themeIds: next });
  };

  return (
    <div className="space-y-4 rounded-lg border border-mist-light bg-parchment-elevated p-4 dark:border-mist-dark dark:bg-ink-elevated">
      <section>
        <p className={sectionLabel}>Outcome</p>
        <div className="flex flex-wrap gap-1.5">
          {TIERS.map((t) => {
            const active = filters.tiers.has(t.value);
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => toggleTier(t.value)}
                aria-pressed={active}
                className={cn(chipBase, active ? chipActive : chipInactive)}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <p className={sectionLabel}>Role</p>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          {ROLES.map((r) => {
            const active = filters.roleFilter === r.value;
            return (
              <button
                key={r.value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() =>
                  onFiltersChange({ ...filters, roleFilter: r.value })
                }
                className={cn(chipBase, active ? chipActive : chipInactive)}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </section>

      {themes.length > 0 ? (
        <section>
          <p className={sectionLabel}>Themes</p>
          <div className="flex flex-wrap gap-1.5">
            {themes.map((t) => {
              const active = filters.themeIds.has(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTheme(t.id)}
                  aria-pressed={active}
                  className={cn(chipBase, active ? chipActive : chipInactive)}
                >
                  {t.name.trim() || "Untitled theme"}
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      <section>
        <p className={sectionLabel}>Date</p>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filters.datePreset}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                datePreset: e.currentTarget.value as HistoryDatePreset,
                customDateFrom:
                  e.currentTarget.value === "custom"
                    ? filters.customDateFrom
                    : null,
                customDateTo:
                  e.currentTarget.value === "custom"
                    ? filters.customDateTo
                    : null,
              })
            }
            aria-label="Date range preset"
            className="h-11 rounded-lg border border-mist-light bg-parchment-elevated px-3 text-sm text-ink-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
          >
            {DATE_PRESETS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {filters.datePreset === "custom" ? (
            <>
              <input
                type="date"
                value={filters.customDateFrom ?? ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    customDateFrom: e.currentTarget.value || null,
                  })
                }
                aria-label="From date"
                className="h-11 rounded-lg border border-mist-light bg-parchment-elevated px-3 text-sm text-ink-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
              />
              <span className="text-xs text-ink-muted dark:text-parchment-muted">
                to
              </span>
              <input
                type="date"
                value={filters.customDateTo ?? ""}
                onChange={(e) =>
                  onFiltersChange({
                    ...filters,
                    customDateTo: e.currentTarget.value || null,
                  })
                }
                aria-label="To date"
                className="h-11 rounded-lg border border-mist-light bg-parchment-elevated px-3 text-sm text-ink-base focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
              />
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
