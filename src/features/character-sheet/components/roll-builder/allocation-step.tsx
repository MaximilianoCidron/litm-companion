"use client";
import { useMemo, useTransition } from "react";
import { Target } from "lucide-react";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { useCampaign } from "../CampaignProvider";
import { allocateLimitProgress } from "../../actions";
import type { RollRecord } from "../../schemas";
import { AllocationForm, type RollMeta } from "./allocation-form";

interface AllocationStepProps {
  roll: RollRecord;
  characterName: string;
  isGmAllocating: boolean;
}

export function AllocationStep({
  roll,
  characterName,
  isGmAllocating,
}: AllocationStepProps) {
  const target = roll.detailedActionTarget;
  const campaign = useCampaign();
  const callAction = useActionWithToast();
  const [pending, startTransition] = useTransition();

  const engaged = useMemo(() => {
    if (!target) return null;
    if (campaign.status === "none") return null;
    return (
      campaign.engagedChallenges.find((c) => c.id === target.challengeId) ??
      null
    );
  }, [campaign, target]);

  if (!target) return null;
  if (!engaged) {
    return (
      <div className="rounded-lg bg-rust/10 px-3 py-2 text-sm text-rust-text dark:bg-rust/15 dark:text-rust-text-dark">
        Challenge is no longer engaged. Allocation unavailable.
      </div>
    );
  }

  const rollMeta: RollMeta = {
    rollId: roll.id,
    characterId: roll.characterId,
    power: roll.power,
    detailedActionTarget: target,
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
      <AllocationForm
        rollMeta={rollMeta}
        engaged={engaged}
        isGmAllocating={isGmAllocating}
        characterName={characterName}
        submitting={pending}
        onSubmit={(allocations) =>
          new Promise<void>((resolve) => {
            startTransition(async () => {
              const summary = allocations.reduce(
                (s, a) => s + a.powerSpent,
                0,
              );
              await callAction(
                allocateLimitProgress({
                  rollId: roll.id,
                  characterId: roll.characterId,
                  campaignId: target.campaignId,
                  challengeId: target.challengeId,
                  allocations,
                }),
                {
                  onSuccess:
                    allocations.length === 0
                      ? "Allocation skipped"
                      : `${summary} Power allocated`,
                },
              );
              resolve();
            });
          })
        }
      />
    </div>
  );
}
