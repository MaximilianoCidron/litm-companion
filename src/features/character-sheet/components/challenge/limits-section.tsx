"use client";

import { useCallback, useState, useTransition } from "react";
import { Check, Minus, Plus, Trash2 } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EditableField,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { mutateChallenge } from "../../actions";
import { useChallenge } from "../challenge-provider";
import type { ChallengeLimit, LimitId } from "../../schemas";

export function LimitsSection() {
  const { challenge } = useChallenge();
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        Limits
      </h3>
      {challenge.limits.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {challenge.limits.map((limit) => (
            <li key={limit.id}>
              <LimitRow limit={limit} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
          No limits yet.
        </p>
      )}
      <AddLimitForm />
    </section>
  );
}

function LimitRow({ limit }: { limit: ChallengeLimit }) {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const limitIdBranded = limit.id as LimitId;
  const overcome = limit.current >= limit.threshold;
  const percent = Math.min(100, (limit.current / limit.threshold) * 100);

  const onRename = useCallback(
    (label: string) =>
      mutateChallenge({
        challengeId: challenge.id,
        campaignId: challenge.campaignId,
        op: { kind: "renameLimit", limitId: limitIdBranded, label },
      }),
    [challenge.id, challenge.campaignId, limitIdBranded],
  );

  const adjust = (delta: -1 | 1) =>
    callAction(
      mutateChallenge({
        challengeId: challenge.id,
        campaignId: challenge.campaignId,
        op: { kind: "updateLimitCurrent", limitId: limitIdBranded, delta },
      }),
    );

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-mist-light bg-parchment-elevated p-3 dark:border-mist-dark dark:bg-ink-elevated">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-[12ch] flex-1">
          <EditableField
            value={limit.label}
            onCommit={onRename}
            ariaLabel="Limit label"
            maxLength={60}
            fontPreset="display"
            className="text-base"
          />
        </div>
        <div className="flex items-center gap-2">
          {overcome ? (
            <span className="inline-flex items-center gap-1 font-display text-sm text-moss-text dark:text-moss-text-dark">
              <Check className="h-4 w-4" aria-hidden="true" />
              Overcome
            </span>
          ) : (
            <span className="numeric font-display text-lg text-ink-base dark:text-parchment-base">
              {limit.current} / {limit.threshold}
            </span>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Decrement"
            disabled={limit.current === 0}
            onClick={() => adjust(-1)}
          >
            <Minus className="h-4 w-4" aria-hidden="true" />
          </Button>
          {!overcome ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Increment"
              onClick={() => adjust(1)}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          ) : null}
          <EditThresholdDialog limit={limit} />
          <ConfirmDialog
            trigger={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete limit ${limit.label}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            }
            title={`Delete "${limit.label}"?`}
            description="This limit will be removed from the challenge."
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={async () => {
              await callAction(
                mutateChallenge({
                  challengeId: challenge.id,
                  campaignId: challenge.campaignId,
                  op: { kind: "removeLimit", limitId: limitIdBranded },
                }),
                { onSuccess: "Limit removed" },
              );
            }}
          />
        </div>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-mist-light dark:bg-mist-dark"
        role="progressbar"
        aria-valuenow={limit.current}
        aria-valuemin={0}
        aria-valuemax={limit.threshold}
        aria-label={`${limit.label} progress`}
      >
        <div
          className="h-full bg-ember transition-[width] duration-150 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function EditThresholdDialog({ limit }: { limit: ChallengeLimit }) {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(limit.threshold);
  const [pending, startTransition] = useTransition();
  const limitIdBranded = limit.id as LimitId;

  const submit = () => {
    const clamped = Math.max(1, Math.min(50, Math.floor(draft)));
    startTransition(async () => {
      const result = await callAction(
        mutateChallenge({
          challengeId: challenge.id,
          campaignId: challenge.campaignId,
          op: {
            kind: "updateLimitThreshold",
            limitId: limitIdBranded,
            threshold: clamped,
          },
        }),
        { onSuccess: "Threshold updated" },
      );
      if (result) setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) setDraft(limit.threshold);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          Edit threshold…
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit threshold</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Threshold (1-50)
            </span>
            <input
              type="number"
              min={1}
              max={50}
              value={draft}
              onChange={(e) => setDraft(Number(e.currentTarget.value))}
              className="rounded-lg border border-mist-light bg-parchment-elevated px-3 py-2 text-base text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
            />
          </label>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={submit}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddLimitForm() {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState("");
  const [threshold, setThreshold] = useState(8);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setLabel("");
    setThreshold(8);
    setEditing(false);
  };

  const submit = () => {
    const trimmed = label.trim();
    const clamped = Math.max(1, Math.min(50, Math.floor(threshold)));
    if (!trimmed) {
      reset();
      return;
    }
    startTransition(async () => {
      const result = await callAction(
        mutateChallenge({
          challengeId: challenge.id,
          campaignId: challenge.campaignId,
          op: { kind: "addLimit", label: trimmed, threshold: clamped },
        }),
        { onSuccess: "Limit added" },
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
        disabled={challenge.limits.length >= 10}
        onClick={() => setEditing(true)}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add limit
      </Button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <label className="flex flex-1 flex-col gap-1 text-sm">
        <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          Label
        </span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.currentTarget.value)}
          maxLength={60}
          autoFocus
          placeholder="e.g., Defeat"
          disabled={pending}
          className="h-10 rounded-lg border border-mist-light bg-parchment-elevated px-3 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
        />
      </label>
      <label className="flex w-24 flex-col gap-1 text-sm">
        <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          Threshold
        </span>
        <input
          type="number"
          min={1}
          max={50}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.currentTarget.value))}
          disabled={pending}
          className="h-10 rounded-lg border border-mist-light bg-parchment-elevated px-3 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
        />
      </label>
      <Button type="submit" size="sm" disabled={pending}>
        Add
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={reset} disabled={pending}>
        Cancel
      </Button>
    </form>
  );
}
