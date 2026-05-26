"use client";
import type { MomentOfFulfillmentEntry } from "../../schemas";
import { PATH_INFO } from "./path-info";

interface MomentHistoryListProps {
  entries: readonly MomentOfFulfillmentEntry[];
}

const DATE_FMT = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/**
 * Path-specific one-line summary for the Legend (history) view. Mirrors
 * the snapshot fields captured at resolution time so renames downstream
 * don't rewrite history.
 */
function summarizeEntry(entry: MomentOfFulfillmentEntry): string {
  switch (entry.path) {
    case "retire":
      return "Retired from the story";
    case "reforge":
      return `Reforged "${entry.replacedThemeName || "Unnamed theme"}" into "${entry.newThemeName || "Unnamed theme"}"`;
    case "gainQuintessence":
      return `Crystallized "${entry.quintessenceName}"`;
    case "shakeWorld":
      return "Shook the world";
    case "speakWordsEternal":
      return `Spoke "${entry.newPowerTagName}" into "${entry.themeName || "Unnamed theme"}"`;
    case "unearthTruths":
      return "Unearthed a truth";
  }
}

function entryNarrative(entry: MomentOfFulfillmentEntry): string {
  if (entry.path === "retire") return entry.finalWords;
  return entry.narrativeDescription;
}

export function MomentHistoryList({ entries }: MomentHistoryListProps) {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) =>
    b.resolvedAt.localeCompare(a.resolvedAt),
  );
  return (
    <details className="rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft">
      <summary className="cursor-pointer font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        Legend ({entries.length})
      </summary>
      <ul className="mt-2 flex flex-col gap-2">
        {sorted.map((entry) => {
          const info = PATH_INFO[entry.path];
          const Icon = info.icon;
          const date = DATE_FMT.format(new Date(entry.resolvedAt));
          const narrative = entryNarrative(entry).trim();
          return (
            <li
              key={entry.id}
              className="flex items-start gap-3 text-sm text-ink-base dark:text-parchment-base"
            >
              <Icon
                className="mt-0.5 h-4 w-4 shrink-0 text-ember"
                aria-hidden="true"
              />
              <div className="flex flex-col">
                <span className="font-display">
                  {summarizeEntry(entry)}
                  <span className="ml-2 text-xs text-ink-subtle dark:text-parchment-subtle">
                    · {date}
                  </span>
                </span>
                {narrative ? (
                  <span className="font-serif italic text-ink-muted dark:text-parchment-muted">
                    &ldquo;{narrative}&rdquo;
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
