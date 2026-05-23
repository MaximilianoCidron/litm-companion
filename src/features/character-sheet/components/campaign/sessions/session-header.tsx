"use client";

import { formatDuration, formatRelativeTime } from "@/shared/lib/format";
import type { Session } from "../../../schemas";

interface SessionHeaderProps {
  session: Session;
  isActive: boolean;
}

export function SessionHeader({ session, isActive }: SessionHeaderProps) {
  const startedAt = new Date(session.startedAt);
  let durationLabel: string;
  if (isActive) {
    durationLabel = `started ${formatRelativeTime(session.startedAt)}`;
  } else if (session.endedAt) {
    durationLabel = formatDuration(
      new Date(session.endedAt).getTime() - startedAt.getTime(),
    );
  } else {
    durationLabel = "in progress";
  }
  return (
    <header>
      <h1 className="font-display text-2xl text-ink-base dark:text-parchment-base">
        Session {session.sessionNumber}
        {session.title ? (
          <span className="font-serif italic text-ink-muted dark:text-parchment-muted">
            {" — "}
            &ldquo;{session.title}&rdquo;
          </span>
        ) : null}
      </h1>
      <p className="mt-1 text-sm text-ink-muted dark:text-parchment-muted">
        {startedAt.toLocaleString()} · {durationLabel}
        {isActive ? (
          <span className="ml-2 inline-flex items-center gap-1 text-moss-text dark:text-moss-text-dark">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-moss"
              aria-hidden="true"
            />
            in progress
          </span>
        ) : null}
      </p>
      {session.notes ? (
        <p className="mt-3 font-serif text-sm italic text-ink-base dark:text-parchment-base">
          {session.notes}
        </p>
      ) : null}
    </header>
  );
}
