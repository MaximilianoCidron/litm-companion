"use client";

import { PlayCircle, StopCircle } from "lucide-react";
import type {
  SessionLogDetails,
  SessionLogEntry,
} from "../../../schemas";

interface SessionBoundaryCardProps {
  entry: SessionLogEntry;
}

/**
 * Distinctive horizontal divider style for sessionBoundary log entries —
 * stands out from the regular card stream as a navigational anchor.
 */
export function SessionBoundaryCard({ entry }: SessionBoundaryCardProps) {
  const details = entry.details as Extract<
    SessionLogDetails,
    { kind: "sessionBoundary" }
  >;
  const Icon = details.boundary === "start" ? PlayCircle : StopCircle;
  const verb = details.boundary === "start" ? "began" : "ended";

  // Subline = entry.text minus the auto-generated "Session N began./ended."
  // prefix. If text only contains the prefix, no subline.
  const prefix = `Session ${details.sessionNumber} ${verb}`;
  const subline = entry.text.startsWith(prefix)
    ? entry.text.slice(prefix.length).replace(/^[.: ]+/, "").trim()
    : entry.text;

  return (
    <article className="my-4 flex flex-col items-center gap-2 text-ember-text-light dark:text-ember-text-dark">
      <div className="flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-ember/30" />
        <div className="inline-flex items-center gap-2 font-display text-sm uppercase tracking-wider">
          <Icon className="h-4 w-4" aria-hidden="true" />
          Session {details.sessionNumber} {verb}
        </div>
        <div className="h-px flex-1 bg-ember/30" />
      </div>
      {subline ? (
        <p className="max-w-md text-center font-serif text-xs italic text-ink-muted dark:text-parchment-muted">
          {subline}
        </p>
      ) : null}
    </article>
  );
}
