"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { Button, ConfirmDialog, TagPill } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { mutateChallenge } from "../../actions";
import { useChallenge } from "../challenge-provider";
import type { TagId } from "../../schemas";

type Polarity = "helpful" | "hindering";

export function TagsSection() {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const anyScratched = challenge.tags.some((t) => t.scratched);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <SectionHeader title="Tags" />
        {anyScratched ? (
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" size="sm">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                Refresh tags
              </Button>
            }
            title="Refresh all tags?"
            description="Unscratch every tag on this challenge."
            confirmLabel="Refresh"
            onConfirm={async () => {
              await callAction(
                mutateChallenge({
                  challengeId: challenge.id,
                  campaignId: challenge.campaignId,
                  op: { kind: "refreshTags" },
                }),
                { onSuccess: "Tags refreshed" },
              );
            }}
          />
        ) : null}
      </div>
      {challenge.tags.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {challenge.tags.map((tag) => {
            const tagId = tag.id as TagId;
            const polarity =
              tag.polarity === "helpful" ? "story-helpful" : "story-hindering";
            return (
              <li key={tag.id}>
                <TagPill
                  polarity={polarity}
                  label={tag.name}
                  state={tag.scratched ? "scratched" : "active"}
                  onToggleScratch={async () => {
                    await callAction(
                      mutateChallenge({
                        challengeId: challenge.id,
                        campaignId: challenge.campaignId,
                        op: { kind: "toggleTagScratch", tagId },
                      }),
                    );
                  }}
                  onRename={async (name) => {
                    await callAction(
                      mutateChallenge({
                        challengeId: challenge.id,
                        campaignId: challenge.campaignId,
                        op: { kind: "renameTag", tagId, name },
                      }),
                    );
                  }}
                  onRemove={async () => {
                    await callAction(
                      mutateChallenge({
                        challengeId: challenge.id,
                        campaignId: challenge.campaignId,
                        op: { kind: "removeTag", tagId },
                      }),
                      { onSuccess: "Tag removed" },
                    );
                  }}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
          No tags yet.
        </p>
      )}
      <ChallengeTagAdder />
    </section>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
      {title}
    </h3>
  );
}

function ChallengeTagAdder() {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [polarity, setPolarity] = useState<Polarity>("hindering");
  const [pending, startTransition] = useTransition();
  const atLimit = challenge.tags.length >= 20;

  const reset = () => {
    setDraft("");
    setPolarity("hindering");
    setEditing(false);
  };

  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      reset();
      return;
    }
    startTransition(async () => {
      const result = await callAction(
        mutateChallenge({
          challengeId: challenge.id,
          campaignId: challenge.campaignId,
          op: { kind: "addTag", name: trimmed, polarity },
        }),
      );
      if (result) reset();
    });
  };

  if (!editing) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={atLimit}
        onClick={() => setEditing(true)}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        {challenge.tags.length > 0 ? "Add another tag" : "Add tag"}
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            reset();
          }
        }}
        placeholder="Tag name…"
        aria-label="New challenge tag"
        maxLength={60}
        autoFocus
        disabled={pending}
        className="h-9 rounded-lg border border-mist-light bg-parchment-elevated px-3 text-sm text-ink-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
      />
      <div role="radiogroup" aria-label="Polarity" className="flex gap-1">
        {(["helpful", "hindering"] as const).map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant={polarity === p ? "primary" : "ghost"}
            role="radio"
            aria-checked={polarity === p}
            onClick={() => setPolarity(p)}
            disabled={pending}
            className="capitalize"
          >
            {p}
          </Button>
        ))}
      </div>
      <Button type="submit" size="sm" disabled={pending || draft.trim() === ""}>
        Add
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={pending}>
        Cancel
      </Button>
    </form>
  );
}
