"use client";
import { useState } from "react";
import { Button } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { evolveTheme } from "../../../actions";
import {
  formatMightLevel,
  nextMightLevel,
  type CharacterId,
  type Theme,
  type ThemeType,
} from "../../../schemas";
import { DialogFormShell, TypeOptionPicker } from "./shared";

interface EvolveDialogProps {
  theme: Theme;
  characterId: CharacterId;
  disabled?: boolean;
}

export function EvolveDialog({
  theme,
  characterId,
  disabled,
}: EvolveDialogProps) {
  const callAction = useActionWithToast();
  const next = nextMightLevel(theme.mightLevel);
  const [newType, setNewType] = useState<ThemeType | null>(null);
  const [newName, setNewName] = useState(theme.name);

  const submitDisabled = next !== null && !newType;

  const onSubmit = async () => {
    const result = await callAction(
      evolveTheme({
        characterId,
        themeId: theme.id,
        newType: next && newType ? newType : undefined,
        newName: newName !== theme.name && newName.trim().length > 0
          ? newName.trim()
          : undefined,
      }),
      { onSuccess: "Theme evolved" },
    );
    return { ok: result !== null };
  };

  if (next !== null) {
    return (
      <DialogFormShell
        trigger={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={disabled}
            className="fx-celebrate ring-1 ring-ember/30"
          >
            Evolve theme
          </Button>
        }
        title="Evolve your theme"
        description={
          <>
            Your theme rises from <strong>{formatMightLevel(theme.mightLevel)}</strong> to{" "}
            <strong>{formatMightLevel(next)}</strong>. Existing tags and improvements
            remain — the Narrator helps interpret their new scope.
          </>
        }
        submitLabel="Evolve · +1 Promise"
        submitDisabled={submitDisabled}
        onSubmit={onSubmit}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            New type
          </span>
          <TypeOptionPicker
            value={newType}
            onChange={setNewType}
            mightLevel={next}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Theme name (optional)
          </span>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.currentTarget.value)}
            maxLength={60}
            className="border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm focus:border-ember focus:outline-none dark:border-mist-dark"
          />
        </label>
      </DialogFormShell>
    );
  }

  // Greatness ceiling
  return (
    <DialogFormShell
      trigger={
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          className="fx-celebrate ring-1 ring-ember/30"
        >
          Evolve theme
        </Button>
      }
      title="Embrace what your theme has become"
      description="Your theme is already at Greatness — its scope cannot rise further. Mark this milestone narratively and claim the Promise it earned you."
      submitLabel="Mark milestone · +1 Promise"
      onSubmit={onSubmit}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Theme name (optional)
        </span>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.currentTarget.value)}
          maxLength={60}
          className="border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm focus:border-ember focus:outline-none dark:border-mist-dark"
        />
      </label>
    </DialogFormShell>
  );
}
