"use client";
import { CloudOff } from "lucide-react";
import { Skeleton } from "@/shared/ui";
import { useCharacter } from "./CharacterProvider";

export function ConnectionBanner() {
  const { error } = useCharacter();
  if (!error) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center gap-2 bg-rust-soft px-4 py-2 text-sm text-rust-text dark:bg-rust-soft-dark dark:text-rust-text-dark"
    >
      <CloudOff className="h-4 w-4" aria-hidden="true" />
      <span>Connection lost. Retrying…</span>
      <Skeleton className="ml-2 h-3 w-12 bg-rust/30 dark:bg-rust-dark/30" />
    </div>
  );
}
