"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { CreateCharacterDialog } from "./CreateCharacterDialog";

export function CreateCharacterCard() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-full min-h-48 flex-col items-center justify-center gap-2 rounded-lg",
          "border-2 border-dashed border-mist-light bg-parchment-soft/50",
          "text-ink-muted transition-colors hover:border-ember/60 hover:text-ember-text-light",
          "dark:border-mist-dark dark:bg-ink-soft/50 dark:text-parchment-muted dark:hover:text-ember-text-dark",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-parchment dark:focus-visible:ring-offset-ink",
        )}
      >
        <Plus className="h-8 w-8" aria-hidden="true" />
        <span className="font-display text-base tracking-tight">New hero</span>
      </button>
      <CreateCharacterDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
