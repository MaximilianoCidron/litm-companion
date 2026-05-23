"use client";

import { useState } from "react";
import type { Campaign, SessionLogEntry } from "../../../schemas";
import { EntryCard } from "../session-log/entry-card";
import { FilterBar } from "../session-log/filter-bar";
import {
  applyFilter,
  summarizeCounts,
  type LogFilter,
} from "../session-log/helpers";

interface SessionTimelineProps {
  entries: readonly SessionLogEntry[];
  campaign: Campaign;
  currentUid: string;
  isGm: boolean;
}

export function SessionTimeline({
  entries,
  campaign,
  currentUid,
  isGm,
}: SessionTimelineProps) {
  const [filter, setFilter] = useState<LogFilter>("all");
  const filtered = applyFilter(entries, filter);
  const counts = summarizeCounts(entries);
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        Timeline
      </h2>
      <FilterBar value={filter} onChange={setFilter} counts={counts} />
      {filtered.length === 0 ? (
        <p className="py-4 text-sm italic text-ink-subtle dark:text-parchment-subtle">
          No entries match this filter.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <EntryCard
                entry={entry}
                campaign={campaign}
                currentUid={currentUid}
                isGm={isGm}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
