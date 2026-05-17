"use client";
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/shared/ui";
import { CreateCharacterDialog } from "./CreateCharacterDialog";

export function DashboardHeader({ firstName }: { firstName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="font-display text-3xl tracking-tight text-ink-base md:text-4xl dark:text-parchment-base">
          Your heroes await, {firstName}
        </h1>
        <Button type="button" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New hero
        </Button>
      </header>
      <CreateCharacterDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
