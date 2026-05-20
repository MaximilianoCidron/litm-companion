"use client";
import { useState } from "react";
import { Button } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { cn } from "@/shared/lib/cn";
import { claimImprovement } from "../../../actions";
import type { CharacterId, Theme } from "../../../schemas";
import { DialogFormShell } from "./shared";

type Choice = "addTag" | "replaceWeakness" | "addImprovement";

interface ImprovementDialogProps {
  theme: Theme;
  characterId: CharacterId;
  disabled?: boolean;
}

const CHOICES: { kind: Choice; label: string; helper: string }[] = [
  {
    kind: "addTag",
    label: "Add a new power tag",
    helper: "Adds a new yellow tag to this theme.",
  },
  {
    kind: "replaceWeakness",
    label: "Replace the weakness",
    helper: "Swaps this theme's weakness for a fresh one.",
  },
  {
    kind: "addImprovement",
    label: "Add a special improvement",
    helper: "Records a narrative or mechanical perk.",
  },
];

export function ImprovementDialog({
  theme,
  characterId,
  disabled,
}: ImprovementDialogProps) {
  const callAction = useActionWithToast();
  const [choice, setChoice] = useState<Choice>("addTag");
  const [tagName, setTagName] = useState("");
  const [weakness, setWeakness] = useState("");
  const [improvement, setImprovement] = useState("");

  const reset = () => {
    setChoice("addTag");
    setTagName("");
    setWeakness("");
    setImprovement("");
  };

  const currentValue =
    choice === "addTag" ? tagName.trim()
    : choice === "replaceWeakness" ? weakness.trim()
    : improvement.trim();
  const submitDisabled = currentValue.length === 0;

  const onSubmit = async () => {
    let payload;
    if (choice === "addTag") {
      payload = { kind: "addTag" as const, name: tagName.trim() };
    } else if (choice === "replaceWeakness") {
      payload = { kind: "replaceWeakness" as const, name: weakness.trim() };
    } else {
      payload = { kind: "addImprovement" as const, text: improvement.trim() };
    }
    const result = await callAction(
      claimImprovement({ characterId, themeId: theme.id, choice: payload }),
      { onSuccess: "Improvement claimed" },
    );
    if (result) {
      reset();
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
          Claim improvement
        </Button>
      }
      title="Claim an improvement"
      description="Your theme has reached a turning point. Choose how the journey changes them."
      submitLabel="Claim"
      submitDisabled={submitDisabled}
      onSubmit={onSubmit}
    >
      <div role="radiogroup" aria-label="Improvement type" className="flex flex-col gap-2">
        {CHOICES.map((c) => {
          const active = choice === c.kind;
          return (
            <button
              key={c.kind}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setChoice(c.kind)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                active
                  ? "border-ember bg-ember/10 text-ink-base dark:bg-ember/20 dark:text-parchment-base"
                  : "border-mist-light bg-parchment-soft text-ink-base hover:border-ember/60 dark:border-mist-dark dark:bg-ink-soft dark:text-parchment-base",
              )}
            >
              <span className="font-display text-sm">{c.label}</span>
              <span className="text-xs text-ink-muted dark:text-parchment-muted">
                {c.helper}
              </span>
            </button>
          );
        })}
      </div>

      {choice === "addTag" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Tag name
          </span>
          <input
            type="text"
            value={tagName}
            onChange={(e) => setTagName(e.currentTarget.value)}
            placeholder="Tag name…"
            maxLength={60}
            autoFocus
            className="border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm focus:border-ember focus:outline-none dark:border-mist-dark"
          />
        </label>
      ) : choice === "replaceWeakness" ? (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            New weakness
          </span>
          <input
            type="text"
            value={weakness}
            onChange={(e) => setWeakness(e.currentTarget.value)}
            placeholder="New weakness…"
            maxLength={60}
            autoFocus
            className="border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm focus:border-ember focus:outline-none dark:border-mist-dark"
          />
        </label>
      ) : (
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Improvement
          </span>
          <textarea
            value={improvement}
            onChange={(e) => setImprovement(e.currentTarget.value)}
            placeholder="Improvement text…"
            maxLength={120}
            autoFocus
            rows={3}
            className="resize-y min-h-20 border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm focus:border-ember focus:outline-none dark:border-mist-dark"
          />
        </label>
      )}
    </DialogFormShell>
  );
}
