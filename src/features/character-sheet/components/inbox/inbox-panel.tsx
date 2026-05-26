"use client";
import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/shared/ui";
import { InboxEmptyState } from "./empty-state";
import { InboxItemRow } from "./inbox-item-row";
import { useInbox } from "./inbox-provider";

interface InboxPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Inbox sheet. Fullscreen on mobile; right-side drawer (w-96) on md+.
 * Uses the project's centered Dialog primitive with className overrides to
 * pin to the right edge — keeps focus trap + ESC handling for free.
 */
export function InboxPanel({ open, onOpenChange }: InboxPanelProps) {
  const { items } = useInbox();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showClose={false}
        className="fixed inset-0 left-0 top-0 flex h-dvh w-full max-w-none -translate-x-0 -translate-y-0 flex-col rounded-none border-0 md:left-auto md:right-0 md:w-96 md:max-w-[24rem] md:border-l md:border-mist-light dark:md:border-mist-dark"
      >
        <header className="flex items-center justify-between border-b border-mist-light bg-ink-muted px-4 py-3 text-parchment-elevated dark:border-mist-dark">
          <DialogTitle className="font-display text-base">Inbox</DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Close inbox"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-parchment-elevated hover:bg-parchment/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-parchment dark:bg-ink">
          {items.length === 0 ? (
            <InboxEmptyState />
          ) : (
            <ul className="divide-y divide-mist-light dark:divide-mist-dark">
              {items.map((item) => (
                <li key={item.id}>
                  <InboxItemRow
                    item={item}
                    onNavigate={() => onOpenChange(false)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
