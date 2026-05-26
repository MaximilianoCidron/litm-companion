"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Button, Skeleton } from "@/shared/ui";
import { useCharacter } from "../CharacterProvider";
import { useRollHistory } from "../../hooks/use-roll-history";
import {
  applyHistoryFilters,
  countActiveFilters,
  emptyFilters,
  hasActiveFilters,
  type HistoryFilters,
} from "../../lib/history-filter";
import { ActiveFilterChips } from "./active-filter-chips";
import { HistoryEmptyState } from "./empty-state";
import { HistoryFilterPanel } from "./history-filter-panel";
import { HistorySearchInput } from "./history-search-input";
import { RollList } from "./roll-list";

const ROLL_LIMIT = 100;

function RollListSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="h-10 w-full" />
      <div className="space-y-2 rounded-lg border border-mist-light p-2 dark:border-mist-dark">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

function ErrorPanel({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-rust-soft bg-rust-soft/40 p-6 text-rust-text dark:border-rust-soft-dark dark:bg-rust-soft-dark/40 dark:text-rust-text-dark">
      <p className="font-display text-lg">Could not load roll history</p>
      <p className="mt-1 text-sm">{message}</p>
    </div>
  );
}

function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="px-4 py-12 text-center">
      <p className="mb-3 text-sm italic text-ink-muted dark:text-parchment-muted">
        No rolls match your filters.
      </p>
      <Button variant="secondary" size="sm" onClick={onClear}>
        Clear all filters
      </Button>
    </div>
  );
}

export function HistoryView() {
  const { character } = useCharacter();
  const state = useRollHistory(character.id, ROLL_LIMIT);
  const [filters, setFilters] = useState<HistoryFilters>(emptyFilters());
  const [panelOpen, setPanelOpen] = useState(false);

  const filtered = useMemo(
    () => applyHistoryFilters(state.rolls, filters),
    [state.rolls, filters],
  );

  if (state.status === "loading") return <RollListSkeleton />;
  if (state.status === "error" && state.rolls.length === 0) {
    return <ErrorPanel message={state.error.message} />;
  }

  const total = state.rolls.length;
  const truncated = total >= ROLL_LIMIT;
  const activeCount = countActiveFilters(filters);
  const filtersActive = hasActiveFilters(filters);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-ink-base dark:text-parchment-base">
          Roll history
        </h2>
        {state.status === "error" ? (
          <span className="text-xs italic text-rust-text dark:text-rust-text-dark">
            Connection issue — showing cached rolls
          </span>
        ) : null}
      </header>

      {total > 0 ? (
        <>
          <div className="flex items-stretch gap-2">
            <HistorySearchInput
              value={filters.text}
              onChange={(text) => setFilters({ ...filters, text })}
            />
            <Button
              type="button"
              variant={panelOpen ? "primary" : "secondary"}
              size="md"
              onClick={() => setPanelOpen((o) => !o)}
              aria-expanded={panelOpen}
              aria-controls="history-filter-panel"
            >
              <SlidersHorizontal
                className="mr-1.5 h-4 w-4"
                aria-hidden="true"
              />
              Filters
              {activeCount > 0 ? (
                <span className="numeric ml-1.5 rounded-full bg-parchment/20 px-1.5 py-0.5 text-xs">
                  {activeCount}
                </span>
              ) : null}
            </Button>
          </div>

          {panelOpen ? (
            <div id="history-filter-panel">
              <HistoryFilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                themes={character.themes}
              />
            </div>
          ) : null}

          {filtersActive ? (
            <ActiveFilterChips
              filters={filters}
              onFiltersChange={setFilters}
              themes={character.themes}
            />
          ) : null}

          <p className="text-xs text-ink-muted dark:text-parchment-muted">
            {filtersActive ? (
              <>
                Showing <span className="numeric">{filtered.length}</span> of{" "}
                <span className="numeric">{total}</span> roll
                {total === 1 ? "" : "s"}
                {truncated ? " (most recent 100)" : ""}
              </>
            ) : (
              <>
                <span className="numeric">{total}</span> roll
                {total === 1 ? "" : "s"}
                {truncated ? " (most recent 100)" : ""}
              </>
            )}
          </p>
        </>
      ) : null}

      {total === 0 ? (
        <HistoryEmptyState />
      ) : filtered.length === 0 ? (
        <FilteredEmptyState onClear={() => setFilters(emptyFilters())} />
      ) : (
        <RollList rolls={filtered} />
      )}
    </div>
  );
}
