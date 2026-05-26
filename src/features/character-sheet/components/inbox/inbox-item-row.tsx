"use client";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Mail, Target } from "lucide-react";
import { formatRelativeTime } from "@/shared/lib/format";
import { cn } from "@/shared/lib/cn";
import type { InboxItem, InboxItemKind } from "../../lib/inbox";

const ICONS: Record<InboxItemKind, typeof Mail> = {
  invitation: Mail,
  "pending-threat": AlertTriangle,
  "pending-allocation": Target,
};

const ICON_TONE: Record<InboxItemKind, string> = {
  invitation: "text-ember",
  "pending-threat": "text-rust",
  "pending-allocation": "text-ember",
};

interface InboxItemRowProps {
  item: InboxItem;
  onNavigate: () => void;
}

export function InboxItemRow({ item, onNavigate }: InboxItemRowProps) {
  const Icon = ICONS[item.kind];
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-start gap-3 px-4 py-3 transition-colors",
        "hover:bg-mist-light/30 focus-visible:bg-mist-light/30 focus-visible:outline-none",
        "dark:hover:bg-mist-dark/30 dark:focus-visible:bg-mist-dark/30",
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 h-4 w-4 flex-shrink-0",
          ICON_TONE[item.kind],
        )}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm text-ink-base dark:text-parchment-base">
          {item.title}
        </p>
        <p className="truncate text-xs text-ink-muted dark:text-parchment-muted">
          {item.description}
        </p>
        <p className="mt-0.5 text-[10px] text-ink-subtle dark:text-parchment-subtle">
          {formatRelativeTime(item.createdAt)}
        </p>
      </div>
      <ChevronRight
        className="mt-1 h-4 w-4 flex-shrink-0 text-ink-muted dark:text-parchment-muted"
        aria-hidden="true"
      />
    </Link>
  );
}
