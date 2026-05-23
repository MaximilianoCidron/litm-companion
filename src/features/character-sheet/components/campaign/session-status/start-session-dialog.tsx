"use client";

import { useState, useTransition } from "react";
import { PlayCircle } from "lucide-react";
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
import { startSession } from "../../../actions";
import type { CampaignId } from "../../../schemas";

interface StartSessionDialogProps {
  campaignId: CampaignId;
}

export function StartSessionDialog({ campaignId }: StartSessionDialogProps) {
  const callAction = useActionWithToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await callAction(
        startSession({ campaignId, title: title.trim() || undefined }),
      );
      if (result) {
        setOpen(false);
        setTitle("");
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setTitle("");
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="primary" size="sm">
          <PlayCircle className="h-4 w-4" aria-hidden="true" />
          Start session
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Begin session</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Session title (optional)
            </span>
            <input
              type="text"
              value={title}
              maxLength={80}
              autoFocus
              onChange={(e) => setTitle(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder="e.g., The bandit camp"
              className="rounded-lg border border-mist-light bg-parchment-elevated px-3 py-2 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
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
            Begin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
