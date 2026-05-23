"use client";

import Link from "next/link";
import { Circle } from "lucide-react";
import { formatDuration, formatRelativeTime } from "@/shared/lib/format";
import type { Session } from "../../../schemas";

interface SessionListItemProps {
  campaignId: string;
  session: Session;
  isActive?: boolean;
}

const DATE_FMT = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export function SessionListItem({
  campaignId,
  session,
  isActive = false,
}: SessionListItemProps) {
  const startedAt = new Date(session.startedAt);
  const durationLabel = isActive
    ? `started ${formatRelativeTime(session.startedAt)}`
    : session.endedAt
      ? formatDuration(
          new Date(session.endedAt).getTime() - startedAt.getTime(),
        )
      : "in progress";

  return (
    <Link
      href={`/campaigns/${campaignId}/sessions/${session.id}`}
      className="block rounded-lg border border-mist-light bg-parchment-elevated p-3 transition-colors hover:border-ember/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:border-mist-dark dark:bg-ink-elevated"
    >
      <div className="flex items-center gap-2">
        <span className="font-display text-sm text-ink-base dark:text-parchment-base">
          Session {session.sessionNumber}
          {session.title ? (
            <span className="font-serif italic text-ink-muted dark:text-parchment-muted">
              {" — "}
              &ldquo;{session.title}&rdquo;
            </span>
          ) : null}
        </span>
        {isActive ? (
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-moss-text dark:text-moss-text-dark">
            <Circle
              className="h-2 w-2 animate-pulse fill-moss text-moss"
              aria-hidden="true"
            />
            in progress
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-ink-subtle dark:text-parchment-subtle">
        {DATE_FMT.format(startedAt)} · {durationLabel}
      </p>
    </Link>
  );
}
