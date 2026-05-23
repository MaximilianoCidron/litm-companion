"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button, ConfirmDialog } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { deleteChallenge } from "../../actions";
import { useChallenge } from "../challenge-provider";

export function DeleteSection() {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const router = useRouter();

  return (
    <section className="flex flex-col gap-2 rounded-lg border border-crimson/30 bg-crimson/5 p-3">
      <h3 className="font-display text-xs uppercase tracking-wider text-crimson dark:text-crimson-dark">
        Danger zone
      </h3>
      <p className="text-xs text-ink-muted dark:text-parchment-muted">
        Removing this challenge cannot be undone.
      </p>
      <ConfirmDialog
        trigger={
          <Button type="button" variant="destructive" size="sm" className="self-start">
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete challenge
          </Button>
        }
        title={`Delete "${challenge.name}"?`}
        description="This challenge will be permanently removed."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={async () => {
          const result = await callAction(
            deleteChallenge({
              challengeId: challenge.id,
              campaignId: challenge.campaignId,
            }),
            { onSuccess: "Challenge deleted" },
          );
          if (result) {
            router.push(`/campaigns/${challenge.campaignId}`);
          }
        }}
      />
    </section>
  );
}
