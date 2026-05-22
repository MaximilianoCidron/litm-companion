"use client";
import { useState, useTransition, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { cn } from "@/shared/lib/cn";
import { addStoryTag } from "../../actions";
import type { CharacterId } from "../../schemas";

type Polarity = "helpful" | "hindering";

interface AddStoryTagFormProps {
  characterId: CharacterId;
}

const ACTIVE_CLASS: Record<Polarity, string> = {
  helpful:
    "bg-tag-power-soft text-tag-power-text dark:bg-tag-power-soft-dark dark:text-tag-power-text-dark",
  hindering:
    "bg-tag-weakness-soft text-tag-weakness-text dark:bg-tag-weakness-soft-dark dark:text-tag-weakness-text-dark",
};

export function AddStoryTagForm({ characterId }: AddStoryTagFormProps) {
  const [name, setName] = useState("");
  const [polarity, setPolarity] = useState<Polarity>("helpful");
  const [isSingleUse, setIsSingleUse] = useState(false);
  const [pending, startTransition] = useTransition();
  const callAction = useActionWithToast();

  const submit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await callAction(
        addStoryTag({
          characterId,
          name: trimmed,
          polarity,
          isSingleUse,
        }),
        { onSuccess: "Story tag added" },
      );
      if (result) {
        setName("");
        setPolarity("helpful");
        setIsSingleUse(false);
      }
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft sm:flex-row sm:items-end sm:flex-wrap"
    >
      <label
        className="flex flex-1 flex-col gap-1 text-sm"
        htmlFor="new-story-tag-name"
      >
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Name
        </span>
        <input
          id="new-story-tag-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="New story tag…"
          maxLength={60}
          disabled={pending}
          aria-label="Story tag name"
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

      <label className="flex items-center gap-2 text-sm text-ink-base dark:text-parchment-base">
        <input
          type="checkbox"
          checked={isSingleUse}
          onChange={(e) => setIsSingleUse(e.currentTarget.checked)}
          disabled={pending}
          className="h-4 w-4 rounded border-mist-light accent-ember dark:border-mist-dark"
        />
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Single-use
        </span>
      </label>

      <Button
        type="submit"
        disabled={pending || name.trim().length === 0}
        className="sm:self-end"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add story tag
      </Button>
    </form>
  );
}
