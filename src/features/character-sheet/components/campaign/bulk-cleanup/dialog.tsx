"use client";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import {
  bulkCleanupCampaign,
  getCampaignCleanupPreviewAction,
} from "../../../actions";
import { Toggle } from "../../settings/setting-row";
import type { CampaignCleanupPreview } from "../../../lib/queries";
import type { CampaignId } from "../../../schemas";

interface Operations {
  unscratchPowerTags: boolean;
  clearHinderingStatuses: boolean;
  discardStoryTags: boolean;
  unburnPowerTags: boolean;
  refreshFellowshipTags: boolean;
  refreshChallengeTags: boolean;
}

const DEFAULT_OPS: Operations = {
  unscratchPowerTags: false,
  clearHinderingStatuses: false,
  discardStoryTags: false,
  unburnPowerTags: false,
  refreshFellowshipTags: false,
  refreshChallengeTags: false,
};

interface BulkCleanupDialogProps {
  campaignId: CampaignId;
}

export function BulkCleanupDialog({ campaignId }: BulkCleanupDialogProps) {
  const [open, setOpen] = useState(false);
  const [ops, setOps] = useState<Operations>(DEFAULT_OPS);
  const [preview, setPreview] = useState<CampaignCleanupPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const callAction = useActionWithToast();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const tStart = setTimeout(() => {
      setPreviewLoading(true);
      setPreview(null);
    }, 0);
    void (async () => {
      const result = await callAction(
        getCampaignCleanupPreviewAction({ campaignId }),
      );
      if (cancelled) return;
      if (result) setPreview(result);
      setPreviewLoading(false);
    })();
    return () => {
      cancelled = true;
      clearTimeout(tStart);
    };
  }, [open, campaignId, callAction]);

  const anySelected = Object.values(ops).some((v) => v);

  const handleApply = async () => {
    setSubmitting(true);
    const result = await callAction(
      bulkCleanupCampaign({ campaignId, operations: ops }),
      { onSuccess: "Party reset" },
    );
    setSubmitting(false);
    if (result) {
      setOpen(false);
      setOps(DEFAULT_OPS);
      router.refresh();
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        Reset party
      </Button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (submitting) return;
          setOpen(next);
          if (!next) setOps(DEFAULT_OPS);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reset the party</DialogTitle>
            <DialogDescription>
              Apply mechanical resets across the whole party in one step.
              Retired heroes are skipped.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-2">
            {previewLoading ? (
              <p className="inline-flex items-center gap-2 text-xs italic text-ink-subtle dark:text-parchment-subtle">
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                Loading current state…
              </p>
            ) : null}

            {preview ? (
              <>
                <OperationRow
                  label="Refresh scratched power tags"
                  hint={`${preview.powerTagsScratched} power tag${
                    preview.powerTagsScratched !== 1 ? "s" : ""
                  } across ${preview.characterCount} hero${
                    preview.characterCount !== 1 ? "es" : ""
                  }`}
                  checked={ops.unscratchPowerTags}
                  onChange={(v) =>
                    setOps((o) => ({ ...o, unscratchPowerTags: v }))
                  }
                  disabled={preview.powerTagsScratched === 0}
                />
                <OperationRow
                  label="Clear hindering statuses"
                  hint={`${preview.hinderingStatuses} status${
                    preview.hinderingStatuses !== 1 ? "es" : ""
                  } active`}
                  checked={ops.clearHinderingStatuses}
                  onChange={(v) =>
                    setOps((o) => ({ ...o, clearHinderingStatuses: v }))
                  }
                  disabled={preview.hinderingStatuses === 0}
                />
                <OperationRow
                  label="Discard non-preserved story tags"
                  hint={`${preview.nonPreservedStoryTags} story tag${
                    preview.nonPreservedStoryTags !== 1 ? "s" : ""
                  } would be discarded`}
                  checked={ops.discardStoryTags}
                  onChange={(v) =>
                    setOps((o) => ({ ...o, discardStoryTags: v }))
                  }
                  disabled={preview.nonPreservedStoryTags === 0}
                />
                <OperationRow
                  label="Refresh fellowship tags"
                  hint={`${preview.fellowshipTagsScratched} fellowship power tag${
                    preview.fellowshipTagsScratched !== 1 ? "s" : ""
                  } scratched`}
                  checked={ops.refreshFellowshipTags}
                  onChange={(v) =>
                    setOps((o) => ({ ...o, refreshFellowshipTags: v }))
                  }
                  disabled={preview.fellowshipTagsScratched === 0}
                />
                <OperationRow
                  label="Refresh engaged challenge tags"
                  hint={`${preview.engagedChallengeTagsScratched} challenge tag${
                    preview.engagedChallengeTagsScratched !== 1 ? "s" : ""
                  } scratched`}
                  checked={ops.refreshChallengeTags}
                  onChange={(v) =>
                    setOps((o) => ({ ...o, refreshChallengeTags: v }))
                  }
                  disabled={preview.engagedChallengeTagsScratched === 0}
                />

                <div className="mt-3 border-t border-rust/30 pt-3">
                  <OperationRow
                    label="Restore burned power tags"
                    hint={
                      <span className="inline-flex items-center gap-1 text-rust-text dark:text-rust-text-dark">
                        <AlertTriangle
                          className="h-3 w-3"
                          aria-hidden="true"
                        />
                        Undoes permanent character costs.{" "}
                        {preview.powerTagsBurned} burned tag
                        {preview.powerTagsBurned !== 1 ? "s" : ""} present.
                      </span>
                    }
                    checked={ops.unburnPowerTags}
                    onChange={(v) =>
                      setOps((o) => ({ ...o, unburnPowerTags: v }))
                    }
                    disabled={preview.powerTagsBurned === 0}
                  />
                </div>

                {preview.retiredCharacterCount > 0 ? (
                  <p className="mt-3 text-xs italic text-ink-subtle dark:text-parchment-subtle">
                    {preview.retiredCharacterCount} retired hero
                    {preview.retiredCharacterCount !== 1
                      ? "es are"
                      : " is"}{" "}
                    skipped.
                  </p>
                ) : null}
              </>
            ) : null}
          </DialogBody>
          <div className="flex justify-end gap-2 border-t border-mist-light px-6 py-3 dark:border-mist-dark">
            <Button
              type="button"
              variant="ghost"
              disabled={submitting}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  variant="primary"
                  disabled={!anySelected || submitting || previewLoading}
                >
                  {submitting ? (
                    <Loader2
                      className="h-4 w-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  Continue…
                </Button>
              }
              title="Apply party reset?"
              description="The selected resets will be applied across the party. This can't be undone."
              confirmLabel="Apply reset"
              variant="destructive"
              onConfirm={handleApply}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function OperationRow({
  label,
  hint,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  hint: ReactNode;
  checked: boolean;
  onChange(next: boolean): void;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 py-1.5",
        disabled && "opacity-50",
      )}
    >
      <div className="flex-1">
        <p className="font-display text-sm text-ink-base dark:text-parchment-base">
          {label}
        </p>
        <p className="text-xs text-ink-muted dark:text-parchment-muted">
          {hint}
        </p>
      </div>
      <Toggle
        checked={checked}
        ariaLabel={label}
        disabled={disabled}
        onChange={onChange}
      />
    </div>
  );
}
