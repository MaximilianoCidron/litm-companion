"use client";
import { useState } from "react";
import { Button } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { replaceTheme } from "../../../actions";
import type { CharacterId, Theme, ThemeType } from "../../../schemas";
import { DialogFormShell, TypeOptionPicker } from "./shared";

interface ReplaceDialogProps {
  theme: Theme;
  characterId: CharacterId;
  disabled?: boolean;
}

export function ReplaceDialog({
  theme,
  characterId,
  disabled,
}: ReplaceDialogProps) {
  const callAction = useActionWithToast();
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<ThemeType | null>(null);
  const [newQuest, setNewQuest] = useState("");

  const submitDisabled = newName.trim().length === 0 || newType === null;

  const onSubmit = async () => {
    if (!newType) return { ok: false };
    const result = await callAction(
      replaceTheme({
        characterId,
        themeId: theme.id,
        newName: newName.trim(),
        newType,
        newQuest: newQuest.trim(),
      }),
      { onSuccess: "Theme replaced" },
    );
    if (result) {
      setNewName("");
      setNewType(null);
      setNewQuest("");
      return { ok: true };
    }
    return { ok: false };
  };

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
          Replace theme
        </Button>
      }
      title="Replace this theme"
      description={
        <span className="block rounded-lg bg-rust-soft px-3 py-2 text-rust-text dark:bg-rust-soft-dark dark:text-rust-text-dark">
          <strong>{theme.name || "This theme"}</strong> will be set aside. Its
          tags, quest, and improvements will be wiped clean, and a new theme
          will take its place. This can&apos;t be undone.
        </span>
      }
      submitLabel="Replace theme · +1 Promise"
      submitVariant="destructive"
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          New theme name
        </span>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.currentTarget.value)}
          placeholder="Name the new theme…"
          maxLength={60}
          autoFocus
          className="border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm focus:border-ember focus:outline-none dark:border-mist-dark"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          New theme type
        </span>
        <TypeOptionPicker value={newType} onChange={setNewType} />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Quest (optional)
        </span>
        <textarea
          value={newQuest}
          onChange={(e) => setNewQuest(e.currentTarget.value)}
          placeholder="What does this theme demand of you?"
          maxLength={200}
          rows={3}
          className="resize-y min-h-20 border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm focus:border-ember focus:outline-none dark:border-mist-dark"
        />
      </label>
    </DialogFormShell>
  );
}
