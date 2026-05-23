"use client";

import { useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { Button, ConfirmDialog } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { resolvePendingThreat } from "../../actions";
import { useRollBuilder } from "../../stores/roll-builder";
import type { PendingThreat } from "../../schemas";
import { consequenceLabel } from "./helpers";

interface ReactionDecisionProps {
  threat: PendingThreat;
}

export function ReactionDecision({ threat }: ReactionDecisionProps) {
  const callAction = useActionWithToast();
  const [pending, startTransition] = useTransition();

  const onRoll = () => {
    useRollBuilder
      .getState()
      .beginReaction(threat.id, threat.campaignId);
  };

  const onTakeIt = () => {
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
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-3 border-y border-ember/40 bg-ember/10 px-4 py-3 text-ink-base dark:text-parchment-base"
    >
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-ember" aria-hidden="true" />
        <p className="font-display text-sm">
          Incoming consequence: {consequenceLabel(threat.consequence)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onRoll}
          disabled={pending}
        >
          Roll Reaction
        </Button>
        <ConfirmDialog
          trigger={
            <Button type="button" variant="ghost" size="sm" disabled={pending}>
              Take it
            </Button>
          }
          title="Apply the full consequence?"
          description="No Reaction Power will be spent. You'll take the consequence as-is."
          confirmLabel="Take it"
          onConfirm={async () => onTakeIt()}
        />
      </div>
    </div>
  );
}
