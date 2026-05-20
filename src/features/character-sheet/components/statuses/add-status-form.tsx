"use client";
import { useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { cn } from "@/shared/lib/cn";
import { applyStatus } from "../../actions";
import type { CharacterId } from "../../schemas";

type Polarity = "helpful" | "hindering";
type Tier = 1 | 2 | 3 | 4 | 5 | 6;
const TIERS: Tier[] = [1, 2, 3, 4, 5, 6];

interface AddStatusFormProps {
  characterId: CharacterId;
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

export function AddStatusForm({ characterId }: AddStatusFormProps) {
  const [name, setName] = useState("");
  const [polarity, setPolarity] = useState<Polarity>("helpful");
  const [tier, setTier] = useState<Tier>(1);
  const [pending, startTransition] = useTransition();
  const callAction = useActionWithToast();

  const submit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await callAction(
        applyStatus({
          characterId,
          status: { kind: "add", name: trimmed, tier, polarity },
        }),
        { onSuccess: "Status applied" },
      );
      if (result) {
        setName("");
        setTier(1);
        setPolarity("helpful");
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft sm:flex-row sm:items-end sm:flex-wrap"
    >
      <label className="flex flex-1 flex-col gap-1 text-sm" htmlFor="new-status-name">
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Name
        </span>
        <input
          id="new-status-name"
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
                "h-10 w-10 rounded font-display text-sm numeric transition-colors",
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
        disabled={pending || name.trim().length === 0}
        className="sm:self-end"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add status
      </Button>
    </form>
  );
}
