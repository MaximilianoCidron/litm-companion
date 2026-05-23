"use client";
import type { ChallengeLimit } from "../../../schemas";

interface LimitListProps {
  limits: readonly ChallengeLimit[];
}

export function LimitList({ limits }: LimitListProps) {
  if (limits.length === 0) return null;
  return (
    <ul className="flex flex-col gap-2">
      {limits.map((l) => {
        const pct =
          l.threshold > 0
            ? Math.min(100, Math.round((l.current / l.threshold) * 100))
            : 0;
        return (
          <li key={l.id} className="flex flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-ink-base dark:text-parchment-base">
                {l.label}
              </span>
              <span className="numeric font-display text-xs text-ink-muted dark:text-parchment-muted">
                {l.current}/{l.threshold}
              </span>
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={l.threshold}
              aria-valuenow={l.current}
              aria-label={`${l.label} progress`}
              className="h-1.5 w-full overflow-hidden rounded-full bg-mist-light dark:bg-mist-dark"
            >
              <div
                className="h-full bg-ember"
                style={{ width: `${pct}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
