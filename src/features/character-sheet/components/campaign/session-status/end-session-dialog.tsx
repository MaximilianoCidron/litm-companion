"use client";

import { useState, useTransition } from "react";
import { StopCircle } from "lucide-react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { endSession } from "../../../actions";
import type { CampaignId } from "../../../schemas";
import { SummaryPanel } from "./summary-panel";

interface EndSessionDialogProps {
  campaignId: CampaignId;
  sessionNumber: number;
}

export function EndSessionDialog({
  campaignId,
  sessionNumber,
}: EndSessionDialogProps) {
  const callAction = useActionWithToast();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await callAction(
        endSession({ campaignId, notes: notes.trim() || undefined }),
      );
      if (result) {
        setOpen(false);
        setNotes("");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setNotes("");
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="secondary" size="sm">
          <StopCircle className="h-4 w-4" aria-hidden="true" />
          End session
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>End Session {sessionNumber}</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          {open ? <SummaryPanel campaignId={campaignId} /> : null}

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Wrap-up notes (optional)
            </span>
            <textarea
              value={notes}
              maxLength={2000}
              rows={3}
              onChange={(e) => setNotes(e.currentTarget.value)}
              placeholder="The party retreated to the old fort to recover…"
              className="rounded-lg border border-mist-light bg-parchment-elevated p-2 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
            />
          </label>
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type="button" disabled={pending} onClick={submit}>
            End session
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
