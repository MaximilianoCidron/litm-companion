"use client";

import Link from "next/link";
import { Pin, PinOff, Trash2 } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { cn } from "@/shared/lib/cn";
import { formatRelativeTime } from "@/shared/lib/format";
import {
  deleteSessionLogEntry,
  toggleSessionLogPin,
} from "../../../actions";
import type {
  Campaign,
  SessionLogEntry,
  SessionLogEntryId,
} from "../../../schemas";
import { kindMeta } from "./helpers";

interface EntryCardProps {
  entry: SessionLogEntry;
  campaign: Campaign;
  currentUid: string;
  isGm: boolean;
  compact?: boolean;
}

export function EntryCard({
  entry,
  campaign,
  currentUid,
  isGm,
  compact = false,
}: EntryCardProps) {
  const callAction = useActionWithToast();
  const meta = kindMeta(entry.details.kind);
  const authorIsGm = entry.authorUid === campaign.gmUid;
  const canDelete = isGm || entry.authorUid === currentUid;

  return (
    <article
      className={cn(
        "rounded-lg bg-parchment-elevated dark:bg-ink-elevated",
        meta.accent,
        compact ? "p-3" : "p-4",
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-ink-muted dark:text-parchment-muted">
            <span className="font-display text-sm text-ink-base dark:text-parchment-base">
              {entry.authorName}
            </span>
            <span className="font-display uppercase tracking-wider text-ember">
              {authorIsGm ? "GM" : "Player"}
            </span>
            <span>· {formatRelativeTime(entry.createdAt)}</span>
            {entry.pinned ? (
              <span className="inline-flex items-center gap-1 text-ember">
                <Pin className="h-3 w-3" aria-hidden="true" />
                pinned
              </span>
            ) : null}
          </div>
          {entry.subjectCharacterId && entry.subjectCharacterName ? (
            <Link
              href={`/characters/${entry.subjectCharacterId}`}
              className="text-xs text-ink-subtle hover:underline dark:text-parchment-subtle"
            >
              → {entry.subjectCharacterName}
            </Link>
          ) : null}
        </div>
        <EntryMenu
          isGm={isGm}
          canDelete={canDelete}
          pinned={entry.pinned}
          onTogglePin={() =>
            callAction(
              toggleSessionLogPin({
                campaignId: campaign.id,
                entryId: entry.id as SessionLogEntryId,
              }),
            )
          }
          onDelete={() =>
            callAction(
              deleteSessionLogEntry({
                campaignId: campaign.id,
                entryId: entry.id as SessionLogEntryId,
              }),
              { onSuccess: "Entry removed" },
            )
          }
        />
      </header>

      <p
        className={cn(
          "mt-2 whitespace-pre-wrap font-serif text-ink-base dark:text-parchment-base",
          compact ? "text-sm" : "text-base",
        )}
      >
        {entry.text}
      </p>

      <footer className="mt-3 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-[10px] uppercase tracking-wider",
            meta.badge,
          )}
        >
          <meta.Icon className="h-3 w-3" aria-hidden="true" />
          {meta.label}
        </span>
        {isGm && entry.details.kind === "deliverThreat" ? (
          <Link
            href={`/campaigns/${campaign.id}/challenges/${entry.details.challengeId}`}
            className="text-xs text-ember hover:underline"
          >
            Linked challenge →
          </Link>
        ) : null}
      </footer>
    </article>
  );
}

interface EntryMenuProps {
  isGm: boolean;
  canDelete: boolean;
  pinned: boolean;
  onTogglePin: () => Promise<unknown>;
  onDelete: () => Promise<unknown>;
}

function EntryMenu({
  isGm,
  canDelete,
  pinned,
  onTogglePin,
  onDelete,
}: EntryMenuProps) {
  if (!isGm && !canDelete) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Entry actions"
        >
          <span className="text-lg leading-none">⋯</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {isGm ? (
          <DropdownMenuItem onSelect={() => void onTogglePin()}>
            {pinned ? (
              <>
                <PinOff className="h-4 w-4" aria-hidden="true" />
                Unpin
              </>
            ) : (
              <>
                <Pin className="h-4 w-4" aria-hidden="true" />
                Pin
              </>
            )}
          </DropdownMenuItem>
        ) : null}
        {canDelete ? (
          <ConfirmDialog
            trigger={
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            }
            title="Delete this entry?"
            description="The entry will be removed from the session log."
            confirmLabel="Delete"
            variant="destructive"
            onConfirm={async () => {
              await onDelete();
            }}
          />
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
