"use client";

import { useCallback, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  EditableField,
  StatusTierBar,
  type StatusTier,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { cn } from "@/shared/lib/cn";
import { mutateChallenge } from "../../actions";
import { useChallenge } from "../challenge-provider";
import type { Status, StatusId } from "../../schemas";

type Polarity = "helpful" | "hindering";
type Tier = 1 | 2 | 3 | 4 | 5 | 6;
const TIERS: Tier[] = [1, 2, 3, 4, 5, 6];

export function StatusesSection() {
  const { challenge } = useChallenge();
  const helpful = challenge.statuses.filter((s) => s.polarity === "helpful");
  const hindering = challenge.statuses.filter(
    (s) => s.polarity === "hindering",
  );

  return (
    <section className="flex flex-col gap-4">
      <h3 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        Statuses
      </h3>
      {challenge.statuses.length === 0 ? (
        <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
          No statuses yet.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {helpful.length > 0 ? (
            <StatusGroup label="Helpful" statuses={helpful} />
          ) : null}
          {hindering.length > 0 ? (
            <StatusGroup label="Hindering" statuses={hindering} />
          ) : null}
        </div>
      )}
      <AddChallengeStatusForm />
    </section>
  );
}

function StatusGroup({
  label,
  statuses,
}: {
  label: string;
  statuses: Status[];
}) {
  return (
    <div>
      <h4 className="mb-2 font-display text-[10px] uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
        {label}
      </h4>
      <ul className="flex flex-col gap-2">
        {statuses.map((s) => (
          <li key={s.id}>
            <ChallengeStatusEditor status={s} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChallengeStatusEditor({ status }: { status: Status }) {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const statusIdBranded = status.id as StatusId;

  const onRename = useCallback(
    (name: string) =>
      mutateChallenge({
        challengeId: challenge.id,
        campaignId: challenge.campaignId,
        op: { kind: "renameStatus", statusId: statusIdBranded, name },
      }),
    [challenge.id, challenge.campaignId, statusIdBranded],
  );

  const onTier = (next: StatusTier) => {
    void callAction(
      mutateChallenge({
        challengeId: challenge.id,
        campaignId: challenge.campaignId,
        op: { kind: "setStatusTier", statusId: statusIdBranded, tier: next },
      }),
    );
  };

  const onClear = () => {
    void callAction(
      mutateChallenge({
        challengeId: challenge.id,
        campaignId: challenge.campaignId,
        op: { kind: "removeStatus", statusId: statusIdBranded },
      }),
      { onSuccess: "Status removed" },
    );
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-mist-light bg-parchment-elevated p-3 dark:border-mist-dark dark:bg-ink-elevated md:flex-row md:items-end">
      <div className="flex-1">
        <EditableField
          value={status.name}
          onCommit={onRename}
          ariaLabel="Status name"
          maxLength={40}
          fontPreset="display"
          className="text-base"
        />
      </div>
      <div className="flex-1">
        <StatusTierBar
          tier={status.tier as StatusTier}
          polarity={status.polarity}
          label={status.name || "Status"}
          onChange={onTier}
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Clear status ${status.name}`}
        onClick={onClear}
      >
        <Trash2 className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

const ACTIVE_CLASS: Record<Polarity, string> = {
  helpful:
    "bg-moss-soft text-moss-text dark:bg-moss-soft-dark dark:text-moss-text-dark",
  hindering:
    "bg-rust-soft text-rust-text dark:bg-rust-soft-dark dark:text-rust-text-dark",
};

const ACTIVE_TIER_CLASS: Record<Polarity, string> = {
  helpful:
    "bg-moss text-parchment-elevated dark:bg-moss-dark dark:text-ink-base",
  hindering:
    "bg-rust text-parchment-elevated dark:bg-rust-dark dark:text-ink-base",
};

function AddChallengeStatusForm() {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const [name, setName] = useState("");
  const [polarity, setPolarity] = useState<Polarity>("hindering");
  const [tier, setTier] = useState<Tier>(1);
  const [pending, startTransition] = useTransition();

  const submit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await callAction(
        mutateChallenge({
          challengeId: challenge.id,
          campaignId: challenge.campaignId,
          op: { kind: "addStatus", name: trimmed, tier, polarity },
        }),
        { onSuccess: "Status added" },
      );
      if (result) {
        setName("");
        setTier(1);
        setPolarity("hindering");
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft sm:flex-row sm:flex-wrap sm:items-end"
    >
      <label
        className="flex flex-1 flex-col gap-1 text-sm"
        htmlFor="new-challenge-status-name"
      >
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Name
        </span>
        <input
          id="new-challenge-status-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="New status…"
          maxLength={40}
          disabled={pending}
          aria-label="Status name"
          className="border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm text-ink-base placeholder:text-ink-subtle focus:border-ember focus:outline-none dark:border-mist-dark dark:text-parchment-base dark:placeholder:text-parchment-subtle"
        />
      </label>
      <div
        className="flex flex-col gap-1 text-sm"
        role="group"
        aria-label="Polarity"
      >
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Polarity
        </span>
        <div className="flex gap-1">
          {(["helpful", "hindering"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPolarity(p)}
              aria-pressed={polarity === p}
              disabled={pending}
              className={cn(
                "h-10 rounded px-3 text-sm font-medium capitalize transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                polarity === p
                  ? ACTIVE_CLASS[p]
                  : "text-ink-muted hover:bg-parchment-elevated dark:text-parchment-muted dark:hover:bg-ink-elevated",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div
        className="flex flex-col gap-1 text-sm"
        role="group"
        aria-label="Tier"
      >
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Tier
        </span>
        <div className="flex gap-1">
          {TIERS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setTier(n)}
              aria-pressed={tier === n}
              disabled={pending}
              className={cn(
                "numeric h-10 w-10 rounded font-display text-sm transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                tier === n
                  ? ACTIVE_TIER_CLASS[polarity]
                  : "bg-parchment-elevated text-ink-muted hover:text-ink-base dark:bg-ink-elevated dark:text-parchment-muted dark:hover:text-parchment-base",
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      <Button
        type="submit"
        size="sm"
        disabled={pending || name.trim().length === 0}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add status
      </Button>
    </form>
  );
}
