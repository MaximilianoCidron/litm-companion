"use client";

import type { MomentOfFulfillmentEntry } from "../../schemas";
import { pathMeta } from "./helpers";

interface MomentHistoryListProps {
  entries: readonly MomentOfFulfillmentEntry[];
}

const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function MomentHistoryList({ entries }: MomentHistoryListProps) {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) =>
    b.completedAt.localeCompare(a.completedAt),
  );
  return (
    <details className="rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft">
      <summary className="cursor-pointer font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        Past moments ({entries.length})
      </summary>
      <ul className="mt-2 flex flex-col gap-2">
        {sorted.map((entry) => {
          const meta = pathMeta(entry.chosenPath);
          const date = DATE_FMT.format(new Date(entry.completedAt));
          return (
            <li
              key={entry.id}
              className="flex items-start gap-3 text-sm text-ink-base dark:text-parchment-base"
            >
              <meta.Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-ember"
                aria-hidden="true"
              />
              <div className="flex flex-col">
                <span className="font-display">
                  {meta.label}
                  <span className="ml-2 text-xs text-ink-subtle dark:text-parchment-subtle">
                    · {date}
                  </span>
                </span>
                {entry.description ? (
                  <span className="font-serif italic text-ink-muted dark:text-parchment-muted">
                    &ldquo;{entry.description}&rdquo;
                  </span>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
