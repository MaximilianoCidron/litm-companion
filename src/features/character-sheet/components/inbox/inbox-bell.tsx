"use client";
import { useState } from "react";
import { Bell } from "lucide-react";
import { InboxPanel } from "./inbox-panel";
import { useInbox } from "./inbox-provider";

/**
 * Header trigger. Badge shows unread count (1..9 or "9+"). Click opens the
 * inbox panel and fires mark-all-seen so the badge clears immediately;
 * the panel still shows items for action. Mark-all-seen is fire-and-forget
 * — UI doesn't await the Firestore write.
 */
export function InboxBell() {
  const [open, setOpen] = useState(false);
  const { unreadCount, markAllSeen } = useInbox();

  const handleOpen = () => {
    setOpen(true);
    if (unreadCount > 0) {
      void markAllSeen();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={
          unreadCount > 0 ? `Inbox (${unreadCount} new)` : "Inbox"
        }
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full text-parchment-elevated hover:bg-parchment/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span
            aria-hidden="true"
            className="numeric absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-ink-muted bg-ember px-1 font-display text-[10px] leading-none text-parchment-elevated dark:border-ink-muted"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>
      <InboxPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
