"use client";

import { Pin } from "lucide-react";
import type { Campaign, SessionLogEntry } from "../../../schemas";
import { EntryCard } from "./entry-card";

interface PinnedSectionProps {
  entries: readonly SessionLogEntry[];
  campaign: Campaign;
  currentUid: string;
  isGm: boolean;
}

export function PinnedSection({
  entries,
  campaign,
  currentUid,
  isGm,
}: PinnedSectionProps) {
  if (entries.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <h2 className="inline-flex items-center gap-1 font-display text-xs uppercase tracking-wider text-ember">
        <Pin className="h-3 w-3" aria-hidden="true" />
        Pinned
      </h2>
      <ul className="flex flex-col gap-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <EntryCard
              entry={entry}
              campaign={campaign}
              currentUid={currentUid}
              isGm={isGm}
              compact
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
