"use client";

import { ScrollText } from "lucide-react";
import type { Campaign, SessionLogEntry } from "../../../schemas";
import { EntryCard } from "./entry-card";

interface EntryListProps {
  entries: readonly SessionLogEntry[];
  campaign: Campaign;
  currentUid: string;
  isGm: boolean;
  emptyMessage?: string;
}

export function EntryList({
  entries,
  campaign,
  currentUid,
  isGm,
  emptyMessage,
}: EntryListProps) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center">
        <ScrollText
          className="h-8 w-8 text-ink-subtle dark:text-parchment-subtle"
          aria-hidden="true"
        />
        <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
          {emptyMessage ?? "No entries match this filter."}
        </p>
      </div>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {entries.map((entry) => (
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
  );
}
