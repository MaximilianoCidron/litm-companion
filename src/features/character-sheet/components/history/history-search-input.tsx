"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/shared/ui";

interface HistorySearchInputProps {
  value: string;
  onChange: (next: string) => void;
}

/**
 * Debounced text input for history search. Local state echoes keystrokes
 * instantly; propagates to parent after 300ms idle. External `value` resets
 * local state (e.g., "Clear all" from chips).
 */
export function HistorySearchInput({ value, onChange }: HistorySearchInputProps) {
  const [local, setLocal] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  // Reset local when parent resets `value` externally (e.g., "Clear all").
  // React docs pattern: sync derived state during render, not in an effect.
  if (value !== lastValue) {
    setLastValue(value);
    setLocal(value);
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 300);
    return () => clearTimeout(id);
  }, [local, value, onChange]);

  return (
    <div className="relative flex-1">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted dark:text-parchment-muted"
        aria-hidden="true"
      />
      <Input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.currentTarget.value)}
        placeholder="Search tag or status name…"
        aria-label="Search roll history"
        className="pl-9 pr-9"
      />
      {local.length > 0 ? (
        <button
          type="button"
          onClick={() => {
            setLocal("");
            onChange("");
          }}
          aria-label="Clear search"
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-muted hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember dark:text-parchment-muted dark:hover:bg-parchment/5"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}
