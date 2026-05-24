"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { useCampaign } from "../../CampaignProvider";
import { allocateLimitProgress } from "../../../actions";
import {
  AllocationForm,
  type RollMeta,
} from "../../roll-builder/allocation-form";
import type { PendingAllocation } from "../../../lib/queries";

interface AllocationDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  allocation: PendingAllocation;
}

export function AllocationDialog({
  open,
  onOpenChange,
  allocation,
}: AllocationDialogProps) {
  const campaign = useCampaign();
  const [submitting, setSubmitting] = useState(false);
  const callAction = useActionWithToast();
  const router = useRouter();

  const engaged = useMemo(() => {
    if (campaign.status === "none") return null;
    return (
      campaign.engagedChallenges.find(
        (c) => c.id === allocation.challengeId,
      ) ?? null
    );
  }, [campaign, allocation.challengeId]);

  const rollMeta: RollMeta = {
    rollId: allocation.rollId,
    characterId: allocation.characterId,
    power: allocation.power,
    detailedActionTarget: {
      campaignId: allocation.campaignId,
      challengeId: allocation.challengeId,
      challengeName: allocation.challengeName,
    },
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (submitting) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Allocate for {allocation.characterName}
          </DialogTitle>
          <DialogDescription>
            {allocation.power} Power from a Detailed action against &ldquo;
            {allocation.challengeName}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          {!engaged ? (
            <p className="text-sm italic text-ink-muted dark:text-parchment-muted">
              &ldquo;{allocation.challengeName}&rdquo; is no longer engaged with
              exposed limits. Re-engage to allocate, or skip via the player&apos;s
              roll history.
            </p>
          ) : (
            <AllocationForm
              rollMeta={rollMeta}
              engaged={engaged}
              isGmAllocating
              characterName={allocation.characterName}
              submitting={submitting}
              onSubmit={async (allocations) => {
                setSubmitting(true);
                const summary = allocations.reduce(
                  (s, a) => s + a.powerSpent,
                  0,
                );
                const result = await callAction(
                  allocateLimitProgress({
                    rollId: allocation.rollId,
                    characterId: allocation.characterId,
                    campaignId: allocation.campaignId,
                    challengeId: allocation.challengeId,
                    allocations,
                  }),
                  {
                    onSuccess:
                      allocations.length === 0
                        ? "Allocation skipped"
                        : `${summary} Power allocated`,
                  },
                );
                setSubmitting(false);
                if (result) {
                  onOpenChange(false);
                  router.refresh();
                }
              }}
            />
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
