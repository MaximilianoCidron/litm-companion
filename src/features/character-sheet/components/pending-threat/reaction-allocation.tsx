"use client";

import { useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { resolvePendingThreat } from "../../actions";
import type { PendingThreat } from "../../schemas";
import { clampReduction, previewFinalTier } from "./helpers";

interface ReactionAllocationProps {
  threat: PendingThreat;
}

export function ReactionAllocation({ threat }: ReactionAllocationProps) {
  const callAction = useActionWithToast();
  const power = threat.reactionPower ?? 0;
  const [pending, startTransition] = useTransition();

  if (threat.consequence.kind === "applyStatus") {
    return (
      <StatusAllocation
        threat={threat}
        power={power}
        pending={pending}
        startTransition={startTransition}
        callAction={callAction}
      />
    );
  }

  return (
    <TagAllocation
      threat={threat}
      power={power}
      pending={pending}
      startTransition={startTransition}
      callAction={callAction}
    />
  );
}

interface SubProps {
  threat: PendingThreat;
  power: number;
  pending: boolean;
  startTransition: (cb: () => void) => void;
  callAction: ReturnType<typeof useActionWithToast>;
}

function StatusAllocation({
  threat,
  power,
  pending,
  startTransition,
  callAction,
}: SubProps) {
  const cons =
    threat.consequence.kind === "applyStatus" ? threat.consequence : null;
  const originalTier = cons?.tier ?? 0;
  const maxReduction = clampReduction(power, originalTier, power);
  const [spent, setSpent] = useState(maxReduction);
  if (!cons) return null;
  const { statusName, polarity } = cons;
  const finalTier = previewFinalTier(originalTier, spent);

  const apply = (powerSpent: number) => {
    startTransition(async () => {
      await callAction(
        resolvePendingThreat({
          pendingThreatId: threat.id,
          campaignId: threat.campaignId,
          reduction:
            powerSpent === 0
              ? { kind: "none" }
              : { kind: "tierReduction", powerSpent },
        }),
        {
          onSuccess:
            finalTier === 0
              ? "Consequence fully prevented"
              : "Consequence reduced",
        },
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
          Your Reaction rolled {power} Power
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-3 text-sm">
          <span>
            Reduce {statusName}-{originalTier} by
          </span>
          <input
            type="range"
            min={0}
            max={maxReduction}
            value={spent}
            onChange={(e) => setSpent(Number(e.currentTarget.value))}
            aria-label="Tiers to reduce"
            className="flex-1 accent-ember"
          />
          <span className="numeric font-display">{spent}</span>
          <span className="text-xs text-ink-muted dark:text-parchment-muted">
            ({spent} Power)
          </span>
        </label>
        <p className="text-sm">
          Final:{" "}
          {finalTier === 0 ? (
            <span className="font-display text-moss-text dark:text-moss-text-dark">
              Fully prevented
            </span>
          ) : (
            <span className="font-display">
              {statusName}-{finalTier} {polarity}
            </span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={pending}
          onClick={() => apply(spent)}
        >
          {finalTier === 0 ? "Prevent it" : "Apply reduction"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => apply(0)}
        >
          Take it as-is
        </Button>
      </div>
    </div>
  );
}

function TagAllocation({
  threat,
  power,
  pending,
  startTransition,
  callAction,
}: SubProps) {
  const cons =
    threat.consequence.kind === "scratchTag" ? threat.consequence : null;
  const canPreserve = power >= 2;
  const [preserve, setPreserve] = useState(canPreserve);
  if (!cons) return null;
  const { tagName } = cons;

  const apply = (preserveTag: boolean) => {
    startTransition(async () => {
      await callAction(
        resolvePendingThreat({
          pendingThreatId: threat.id,
          campaignId: threat.campaignId,
          reduction: { kind: "tagPreservation", preserve: preserveTag },
        }),
        {
          onSuccess: preserveTag
            ? "Tag preserved"
            : "Tag scratched",
        },
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
          Your Reaction rolled {power} Power
        </p>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={preserve}
          disabled={!canPreserve || pending}
          onChange={(e) => setPreserve(e.currentTarget.checked)}
          className="h-4 w-4 accent-ember"
        />
        <span>
          Preserve &ldquo;{tagName}&rdquo; from being scratched (costs 2 Power)
        </span>
      </label>
      {!canPreserve ? (
        <p className="text-xs italic text-rust-text dark:text-rust-text-dark">
          Not enough Power to preserve — needs 2.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={pending}
          onClick={() => apply(preserve && canPreserve)}
        >
          Confirm
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => apply(false)}
        >
          Take the scratch
        </Button>
      </div>
    </div>
  );
}
