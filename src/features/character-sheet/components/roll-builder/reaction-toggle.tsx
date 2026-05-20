"use client";
import { Shield } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useIsReaction, useRollBuilder } from "../../stores/roll-builder";

export function ReactionToggle() {
  const active = useIsReaction();
  const setReaction = useRollBuilder((s) => s.setReaction);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={() => setReaction(!active)}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
        active
          ? "bg-ember/10 text-ember-text-light dark:bg-ember/20 dark:text-ember-text-dark"
          : "text-ink-base hover:bg-parchment-soft dark:text-parchment-base dark:hover:bg-ink-soft",
      )}
    >
      <span
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-full border",
          active
            ? "border-ember bg-ember text-parchment-elevated"
            : "border-mist-light dark:border-mist-dark",
        )}
      >
        <Shield className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="flex flex-col">
        <span className="font-display text-sm">Reaction</span>
        <span className="text-xs text-ink-muted dark:text-parchment-muted">
          Reduce incoming consequences
        </span>
      </span>
    </button>
  );
}
