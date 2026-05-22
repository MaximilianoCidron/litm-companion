"use client";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button, Tooltip, TooltipContent, TooltipTrigger, toast } from "@/shared/ui";
import type { ActionResult } from "@/shared/auth";

const POWER_TAG_LIMIT = 12;

interface PowerTagAdderProps {
  /** Callback fired with the trimmed name. Returns the ActionResult so the
   * adder can decide whether to reset on success or surface an error toast. */
  onAdd: (name: string) => Promise<ActionResult<unknown>>;
  currentCount: number;
  disabled?: boolean;
}

export function PowerTagAdder({
  onAdd,
  currentCount,
  disabled,
}: PowerTagAdderProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const atLimit = currentCount >= POWER_TAG_LIMIT;

  const reset = () => {
    setDraft("");
    setEditing(false);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      reset();
      return;
    }
    startTransition(async () => {
      const result = await onAdd(trimmed);
      if (result.ok) {
        reset();
      } else {
        toast.error("Couldn't add tag", { description: result.error.message });
      }
    });
  };

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
        className="flex items-center gap-2"
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
          onBlur={commit}
          placeholder="Tag name…"
          aria-label="New power tag name"
          maxLength={60}
          autoFocus
          disabled={pending}
          className="h-9 rounded-lg border border-tag-power-base bg-tag-power-soft px-3 text-sm text-tag-power-text placeholder:text-tag-power-text/50 focus:outline-none focus:ring-2 focus:ring-ember dark:bg-tag-power-soft-dark dark:text-tag-power-text-dark"
        />
        <Button
          type="submit"
          size="sm"
          disabled={pending || draft.trim().length === 0}
        >
          Add
        </Button>
      </form>
    );
  }

  const button = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setEditing(true)}
      disabled={disabled || atLimit}
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      {currentCount > 0 ? "Add another" : "Add power tag"}
    </Button>
  );

  if (atLimit) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{button}</span>
        </TooltipTrigger>
        <TooltipContent>Tag limit reached</TooltipContent>
      </Tooltip>
    );
  }

  return button;
}
