"use client";

import { useTransition } from "react";
import { Button, ConfirmDialog } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { formatRelativeTime } from "@/shared/lib/format";
import {
  cancelPendingThreat,
  resolvePendingThreat,
} from "../../actions";
import { usePresenceOne } from "../../hooks/use-presence";
import { PresenceDot } from "../presence/presence-dot";
import type { PendingThreat } from "../../schemas";
import { consequenceLabel } from "./helpers";

interface GmPendingRowProps {
  threat: PendingThreat;
}

export function GmPendingRow({ threat }: GmPendingRowProps) {
  const callAction = useActionWithToast();
  const [pending, startTransition] = useTransition();
  const targetPresence = usePresenceOne(threat.targetUid);
  const statusLabel =
    threat.status === "reactionRolled"
      ? `reaction rolled (${threat.reactionPower ?? 0} Power)`
      : "awaiting reaction";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-mist-light px-3 py-2 dark:border-mist-dark">
      <div className="flex min-w-0 flex-col">
        <span className="inline-flex items-center gap-2 font-display text-sm">
          <PresenceDot uid={threat.targetUid} />
          {threat.targetCharacterName} — {consequenceLabel(threat.consequence)}
        </span>
        <span className="text-xs text-ink-subtle dark:text-parchment-subtle">
          {statusLabel} · {formatRelativeTime(threat.createdAt)}
          {targetPresence.isOnline
            ? null
            : " · target is offline — they'll see this when they return"}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <ConfirmDialog
          trigger={
            <Button type="button" variant="secondary" size="sm" disabled={pending}>
              Resolve now
            </Button>
          }
          title="Apply the full consequence?"
          description="Reaction Power (if any) is ignored. Use this when the player is taking too long."
          confirmLabel="Resolve"
          onConfirm={async () => {
            startTransition(async () => {
              await callAction(
                resolvePendingThreat({
                  pendingThreatId: threat.id,
                  campaignId: threat.campaignId,
                  reduction: { kind: "none" },
                }),
                { onSuccess: "Consequence applied" },
              );
            });
          }}
        />
        <ConfirmDialog
          trigger={
            <Button type="button" variant="ghost" size="sm" disabled={pending}>
              Cancel
            </Button>
          }
          title="Cancel this pending threat?"
          description="No consequence applied. The pending threat disappears from both sides."
          confirmLabel="Cancel"
          variant="destructive"
          onConfirm={async () => {
            startTransition(async () => {
              await callAction(
                cancelPendingThreat({
                  pendingThreatId: threat.id,
                  campaignId: threat.campaignId,
                }),
                { onSuccess: "Pending threat canceled" },
              );
            });
          }}
        />
      </div>
    </div>
  );
}
