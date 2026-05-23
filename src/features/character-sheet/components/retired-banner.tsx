"use client";

import { Archive } from "lucide-react";
import { useCharacter } from "./CharacterProvider";

/**
 * Banner rendered above the book-tab nav when the active character is
 * retired. Reads `isRetired` from the live snapshot so it appears/disappears
 * reactively when a Moment of Fulfillment toggles the status.
 */
export function RetiredBanner() {
  const { isRetired } = useCharacter();
  if (!isRetired) return null;
  return (
    <div className="flex items-center justify-center gap-2 border-y border-mist bg-mist-light px-4 py-2 text-ink-base dark:bg-mist-dark dark:text-parchment-base">
      <Archive className="h-4 w-4" aria-hidden="true" />
      <span className="font-display text-sm uppercase tracking-wider">
        Retired hero — read only
      </span>
    </div>
  );
}
