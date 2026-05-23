"use client";

import { useCallback } from "react";
import { EditableField } from "@/shared/ui";
import { mutateChallenge } from "../../actions";
import { useChallenge } from "../challenge-provider";

export function NotesSection() {
  const { challenge } = useChallenge();
  const onCommit = useCallback(
    (notes: string) =>
      mutateChallenge({
        challengeId: challenge.id,
        campaignId: challenge.campaignId,
        op: { kind: "setNotes", notes },
      }),
    [challenge.id, challenge.campaignId],
  );

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft">
      <h3 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        Notes (GM private)
      </h3>
      <EditableField
        multiline
        value={challenge.notes}
        onCommit={onCommit}
        ariaLabel="Challenge notes"
        maxLength={2000}
        fontPreset="prose"
        placeholder="Plotting, tactics, lore — only the GM sees this."
      />
    </section>
  );
}
