import { CheckCircle2 } from "lucide-react";

export function InboxEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <CheckCircle2
        className="mb-3 h-8 w-8 text-moss"
        aria-hidden="true"
      />
      <p className="font-display text-sm text-ink-base dark:text-parchment-base">
        All caught up
      </p>
      <p className="mt-1 text-xs text-ink-muted dark:text-parchment-muted">
        Nothing needs your attention right now.
      </p>
    </div>
  );
}
