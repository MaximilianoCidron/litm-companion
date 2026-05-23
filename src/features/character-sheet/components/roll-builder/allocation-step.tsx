"use client";
import { useMemo, useState, useTransition } from "react";
import { Target } from "lucide-react";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { useCampaign } from "../CampaignProvider";
import { allocateLimitProgress } from "../../actions";
import type { LimitId, RollRecord } from "../../schemas";

interface AllocationStepProps {
  roll: RollRecord;
}

export function AllocationStep({ roll }: AllocationStepProps) {
  const target = roll.detailedActionTarget;
  const campaign = useCampaign();
  const callAction = useActionWithToast();
  const [pending, startTransition] = useTransition();
  const [allocations, setAllocations] = useState<Map<string, number>>(new Map());

  const engaged = useMemo(() => {
    if (!target) return null;
    if (campaign.status === "none") return null;
    return (
      campaign.engagedChallenges.find((c) => c.id === target.challengeId) ??
      null
    );
  }, [campaign, target]);

  const limits = engaged?.limits ?? [];
  const totalAllocated = useMemo(
    () => Array.from(allocations.values()).reduce((sum, n) => sum + n, 0),
    [allocations],
  );
  const remaining = roll.power - totalAllocated;

  if (!target) return null;
  if (!engaged) {
    return (
      <div className="rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust-text dark:bg-rust/15 dark:text-rust-text-dark">
        Challenge is no longer engaged. Allocation unavailable.
      </div>
    );
  }
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
    const maxAllowable = Math.min(limitHeadroom, roll.power);
    const clampedSelf = Math.max(0, Math.min(value, maxAllowable));
    const others = Array.from(allocations.entries())
      .filter(([id]) => id !== limitId)
      .reduce((sum, [, v]) => sum + v, 0);
    const finalValue = Math.max(0, Math.min(clampedSelf, roll.power - others));
    setAllocations((prev) => {
      const next = new Map(prev);
      next.set(limitId, finalValue);
      return next;
    });
  };

  const handleSubmit = () => {
    if (pending) return;
    startTransition(async () => {
      const payload = Array.from(allocations.entries())
        .filter(([, v]) => v > 0)
        .map(([limitId, powerSpent]) => ({
          limitId: limitId as LimitId,
          powerSpent,
        }));
      await callAction(
        allocateLimitProgress({
          rollId: roll.id,
          characterId: roll.characterId,
          campaignId: target.campaignId,
          challengeId: target.challengeId,
          allocations: payload,
        }),
        {
          onSuccess:
            payload.length === 0
              ? "Allocation skipped"
              : `${payload.reduce((s, a) => s + a.powerSpent, 0)} Power allocated`,
        },
      );
    });
  };

  return (
    <div className="flex flex-col gap-3 border-t border-mist-light pt-4 dark:border-mist-dark">
      <h3 className="inline-flex items-center gap-2 font-display text-sm uppercase tracking-wider text-ink-base dark:text-parchment-base">
        <Target className="h-4 w-4 text-rust" aria-hidden="true" />
        Advance &ldquo;{engaged.name}&rdquo;
      </h3>
      <p className="text-xs text-ink-muted dark:text-parchment-muted">
        Spend Power on this challenge&apos;s limits. Unspent Power evaporates.
      </p>

      <div className="flex flex-col gap-3">
        {limits.map((limit) => {
          const value = allocations.get(limit.id) ?? 0;
          const overcomeAlready = limit.current >= limit.threshold;
          const limitHeadroom = Math.max(0, limit.threshold - limit.current);
          const maxSlider = Math.min(limitHeadroom, roll.power);
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
                disabled={overcomeAlready || pending}
                onChange={(e) =>
                  handleSlide(limit.id, Number(e.target.value))
                }
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
            {roll.power - remaining}
          </span>{" "}
          spent · <span className="numeric">{remaining}</span> unspent
        </span>
      </div>

      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={pending}
          onClick={handleSubmit}
        >
          {totalAllocated === 0 ? "Skip — keep narratively" : "Apply allocation"}
        </Button>
      </div>
    </div>
  );
}
