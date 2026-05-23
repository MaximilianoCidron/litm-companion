"use client";

import { Download, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui";
import { useCharacter } from "./CharacterProvider";

/**
 * Kebab menu rendered in the Hero identity card. Currently hosts the
 * "Export PDF" action; future actions (Delete, Share, etc.) slot in here.
 * Visible to both owner and GM (matches read access).
 */
export function CharacterHeaderMenu() {
  const { character } = useCharacter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Character actions"
          className="rounded p-2 text-ink-muted transition-colors hover:bg-parchment-soft dark:text-parchment-muted dark:hover:bg-ink-soft"
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <a
            href={`/api/characters/${character.id}/export-pdf`}
            download
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export PDF
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
