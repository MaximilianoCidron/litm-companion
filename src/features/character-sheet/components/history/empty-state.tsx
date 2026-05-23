import { Dices } from "lucide-react";

export function HistoryEmptyState() {
  return (
    <div className="px-4 py-12 text-center">
      <Dices
        className="mx-auto mb-3 h-12 w-12 text-ink-subtle dark:text-parchment-subtle"
        aria-hidden="true"
      />
      <p className="mb-1 font-display text-lg text-ink-base dark:text-parchment-base">
        No rolls yet
      </p>
      <p className="text-sm text-ink-subtle dark:text-parchment-subtle">
        Roll from the panel — every result lands here for the record.
      </p>
    </div>
  );
}
