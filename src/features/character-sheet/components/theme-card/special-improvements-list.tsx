"use client";
import { useCallback, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import {
  Button,
  EditableField,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { mutateSpecialImprovements } from "../../actions";
import type { CharacterId, ThemeId } from "../../schemas";

const LIMIT = 12;

interface SpecialImprovementsListProps {
  characterId: CharacterId;
  themeId: ThemeId;
  improvements: string[];
  disabled?: boolean;
}

function ExistingRow({
  characterId,
  themeId,
  index,
  text,
  disabled,
}: {
  characterId: CharacterId;
  themeId: ThemeId;
  index: number;
  text: string;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const onCommit = useCallback(
    (next: string) =>
      mutateSpecialImprovements({
        characterId,
        themeId,
        op: { kind: "edit", index, text: next },
      }),
    [characterId, themeId, index],
  );

  const onRemove = () => {
    startTransition(async () => {
      const result = await mutateSpecialImprovements({
        characterId,
        themeId,
        op: { kind: "remove", index },
      });
      if (!result.ok) {
        toast.error("Couldn't remove improvement", {
          description: result.error.message,
        });
      }
    });
  };

  return (
    <li className="group flex items-start gap-2">
      <span aria-hidden="true" className="mt-2 text-ember">
        •
      </span>
      <div className="flex-1">
        <EditableField
          value={text}
          onCommit={onCommit}
          maxLength={120}
          disabled={disabled || pending}
          ariaLabel={`Special improvement ${index + 1}`}
          className="text-sm"
        />
      </div>
      {!disabled ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          aria-label="Remove improvement"
          className={cn(
            "mt-1 hidden h-6 w-6 shrink-0 items-center justify-center rounded text-ink-muted hover:bg-parchment-soft hover:text-crimson",
            "dark:text-parchment-muted dark:hover:bg-ink-soft dark:hover:text-crimson-dark",
            "group-hover:flex group-focus-within:flex",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
            "disabled:opacity-50",
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </li>
  );
}

function NewRow({
  characterId,
  themeId,
  onDone,
}: {
  characterId: CharacterId;
  themeId: ThemeId;
  onDone: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const commit = () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      onDone();
      return;
    }
    startTransition(async () => {
      const result = await mutateSpecialImprovements({
        characterId,
        themeId,
        op: { kind: "add", text: trimmed },
      });
      if (result.ok) {
        onDone();
      } else {
        toast.error("Couldn't add improvement", {
          description: result.error.message,
        });
      }
    });
  };

  return (
    <li className="flex items-start gap-2">
      <span aria-hidden="true" className="mt-2 text-ember">
        •
      </span>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit();
        }}
        className="flex flex-1 items-center gap-2"
      >
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onDone();
            }
          }}
          onBlur={commit}
          placeholder="Describe the improvement…"
          aria-label="New special improvement"
          maxLength={120}
          autoFocus
          disabled={pending}
          className="flex-1 border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm text-ink-base placeholder:text-ink-subtle focus:border-ember focus:outline-none dark:border-mist-dark dark:text-parchment-base dark:placeholder:text-parchment-subtle"
        />
      </form>
    </li>
  );
}

export function SpecialImprovementsList({
  characterId,
  themeId,
  improvements,
  disabled = false,
}: SpecialImprovementsListProps) {
  const [adding, setAdding] = useState(false);
  const atLimit = improvements.length >= LIMIT;

  const addButton = (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      disabled={disabled || atLimit}
      onClick={() => setAdding(true)}
    >
      <Plus className="h-4 w-4" aria-hidden="true" />
      Add improvement
    </Button>
  );

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {improvements.map((text, i) => (
          <ExistingRow
            key={i}
            characterId={characterId}
            themeId={themeId}
            index={i}
            text={text}
            disabled={disabled}
          />
        ))}
        {adding ? (
          <NewRow
            characterId={characterId}
            themeId={themeId}
            onDone={() => setAdding(false)}
          />
        ) : null}
      </ul>
      {!adding && !disabled ? (
        atLimit ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>{addButton}</span>
            </TooltipTrigger>
            <TooltipContent>Limit reached</TooltipContent>
          </Tooltip>
        ) : (
          addButton
        )
      ) : null}
    </div>
  );
}
