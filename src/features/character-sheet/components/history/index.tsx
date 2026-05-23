"use client";

import { useState } from "react";
import { Skeleton } from "@/shared/ui";
import { useCharacter } from "../CharacterProvider";
import { useRollHistory } from "../../hooks/use-roll-history";
import type { RollRecord } from "../../schemas";
import { HistoryEmptyState } from "./empty-state";
import { FilterBar, type RollFilter, type RollFilterCounts } from "./filter-bar";
import { RollList } from "./roll-list";

function applyFilter(
  rolls: readonly RollRecord[],
  filter: RollFilter,
): readonly RollRecord[] {
  if (filter === "all") return rolls;
  if (filter === "reactions") return rolls.filter((r) => r.isReaction);
  return rolls.filter((r) => !r.isReaction && r.tier === filter);
}

function summarize(rolls: readonly RollRecord[]): RollFilterCounts {
  return {
    all: rolls.length,
    success: rolls.filter((r) => !r.isReaction && r.tier === "success").length,
    mixed: rolls.filter((r) => !r.isReaction && r.tier === "mixed").length,
    failure: rolls.filter((r) => !r.isReaction && r.tier === "failure").length,
    reactions: rolls.filter((r) => r.isReaction).length,
  };
}

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

export function HistoryView() {
  const { character } = useCharacter();
  const state = useRollHistory(character.id);
  const [filter, setFilter] = useState<RollFilter>("all");

  if (state.status === "loading") return <RollListSkeleton />;
  if (state.status === "error" && state.rolls.length === 0) {
    return <ErrorPanel message={state.error.message} />;
  }

  const counts = summarize(state.rolls);
  const filtered = applyFilter(state.rolls, filter);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-ink-base dark:text-parchment-base">
          Roll history
        </h2>
        {state.status === "error" && (
          <span className="text-xs italic text-rust-text dark:text-rust-text-dark">
            Connection issue — showing cached rolls
          </span>
        )}
      </header>

      <FilterBar value={filter} onChange={setFilter} counts={counts} />

      {state.rolls.length === 0 ? (
        <HistoryEmptyState />
      ) : filtered.length === 0 ? (
        <p className="py-8 text-center text-sm italic text-ink-subtle dark:text-parchment-subtle">
          No rolls match this filter.
        </p>
      ) : (
        <RollList rolls={filtered} />
      )}

      <p className="pt-4 text-center text-xs text-ink-subtle dark:text-parchment-subtle">
        Showing the {Math.min(30, state.rolls.length)} most recent rolls.
      </p>
    </div>
  );
}
