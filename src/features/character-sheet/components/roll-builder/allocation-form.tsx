"use client";
import { useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type {
  CampaignId,
  ChallengeId,
  EngagedChallenge,
  LimitId,
} from "../../schemas";

/**
 * Narrow shape needed by the allocation form. Used in two contexts:
 *   - Inline AllocationStep inside RollResultDialog: built from a RollRecord.
 *   - GM-side AllocationDialog: built from a PendingAllocation summary
 *     (we don't load the full roll record there — power + ids suffice).
 */
export interface RollMeta {
  rollId: string;
  characterId: string;
  power: number;
  detailedActionTarget: {
    campaignId: CampaignId;
    challengeId: ChallengeId;
    challengeName: string;
  };
}

export interface AllocationFormProps {
  rollMeta: RollMeta;
  engaged: EngagedChallenge;
  isGmAllocating: boolean;
  characterName: string;
  submitting: boolean;
  onSubmit(
    allocations: Array<{ limitId: LimitId; powerSpent: number }>,
  ): Promise<void>;
}

export function AllocationForm({
  rollMeta,
  engaged,
  isGmAllocating,
  characterName,
  submitting,
  onSubmit,
}: AllocationFormProps) {
  const [allocations, setAllocations] = useState<Map<string, number>>(new Map());
  const limits = engaged.limits;
  const totalAllocated = useMemo(
    () => Array.from(allocations.values()).reduce((sum, n) => sum + n, 0),
    [allocations],
  );
  const remaining = rollMeta.power - totalAllocated;

  if (limits.length === 0) {
    return (
      <div className="rounded-lg bg-mist-light/40 px-3 py-2 text-sm text-ink-muted dark:bg-mist-dark/40 dark:text-parchment-muted">
        Challenge no longer exposes limits.
      </div>
    );
  }

  const handleSlide = (limitId: string, value: number) => {
    const limit = limits.find((l) => l.id === limitId);
    if (!limit) return;
    const limitHeadroom = Math.max(0, limit.threshold - limit.current);
    const maxAllowable = Math.min(limitHeadroom, rollMeta.power);
    const clampedSelf = Math.max(0, Math.min(value, maxAllowable));
    const others = Array.from(allocations.entries())
      .filter(([id]) => id !== limitId)
      .reduce((sum, [, v]) => sum + v, 0);
    const finalValue = Math.max(
      0,
      Math.min(clampedSelf, rollMeta.power - others),
    );
    setAllocations((prev) => {
      const next = new Map(prev);
      next.set(limitId, finalValue);
      return next;
    });
  };

  const handleApply = async () => {
    if (submitting) return;
    const payload = Array.from(allocations.entries())
      .filter(([, v]) => v > 0)
      .map(([limitId, powerSpent]) => ({
        limitId: limitId as LimitId,
        powerSpent,
      }));
    await onSubmit(payload);
  };

  return (
    <div className="flex flex-col gap-3">
      {isGmAllocating ? (
        <div className="rounded border-l-2 border-ember bg-ember/10 px-3 py-2 dark:bg-ember/5">
          <p className="inline-flex items-center gap-1.5 text-xs text-ember-text-light dark:text-ember-text-dark">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" />
            Allocating as GM on behalf of{" "}
            <span className="font-display">{characterName}</span>
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {limits.map((limit) => {
          const value = allocations.get(limit.id) ?? 0;
          const overcomeAlready = limit.current >= limit.threshold;
          const limitHeadroom = Math.max(0, limit.threshold - limit.current);
          const maxSlider = Math.min(limitHeadroom, rollMeta.power);
          return (
            <div
              key={limit.id}
              className={cn(overcomeAlready && "opacity-50")}
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm">
                  {limit.label}
                  {overcomeAlready ? (
                    <span className="ml-2 text-xs text-moss-text dark:text-moss-text-dark">
                      overcome
                    </span>
                  ) : null}
                </span>
                <span className="numeric text-xs text-ink-muted dark:text-parchment-muted">
                  {limit.current + value} / {limit.threshold}
                  {value > 0 ? (
                    <span className="ml-2 text-ember">+{value}</span>
                  ) : null}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={maxSlider}
                value={value}
                disabled={overcomeAlready || submitting}
                onChange={(e) => handleSlide(limit.id, Number(e.target.value))}
                aria-label={`Spend Power on ${limit.label}`}
                className="w-full accent-ember"
              />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-muted dark:text-parchment-muted">
          Power:{" "}
          <span className="numeric font-display text-base text-ink-base dark:text-parchment-base">
            {rollMeta.power - remaining}
          </span>{" "}
          spent · <span className="numeric">{remaining}</span> unspent
        </span>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={submitting}
          onClick={handleApply}
        >
          {submitting
            ? "Applying…"
            : totalAllocated === 0
              ? "Skip — keep narratively"
              : "Apply allocation"}
        </Button>
      </div>
    </div>
  );
}
