"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { createChallenge } from "../../../actions";
import type {
  CampaignId,
  ChallengeRole,
  MightLevel,
} from "../../../schemas";
import { RolePicker } from "../../challenge/role-picker";
import { MightPicker } from "../../challenge/might-picker";

interface CreateChallengeDialogProps {
  campaignId: CampaignId;
}

export function CreateChallengeDialog({ campaignId }: CreateChallengeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<ChallengeRole>("aggressor");
  const [mightLevel, setMightLevel] = useState<MightLevel>("adventure");
  const [pending, startTransition] = useTransition();
  const callAction = useActionWithToast();
  const router = useRouter();

  const reset = () => {
    setName("");
    setRole("aggressor");
    setMightLevel("adventure");
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await callAction(
        createChallenge({ campaignId, name: trimmed, role, mightLevel }),
        { onSuccess: "Challenge forged" },
      );
      if (result) {
        setOpen(false);
        reset();
        router.push(`/campaigns/${campaignId}/challenges/${result.challengeId}`);
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="primary" size="sm">
          <Plus className="h-4 w-4" aria-hidden="true" />
          New challenge
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-md">
        <DialogHeader>
          <DialogTitle>Forge a challenge</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <label
            htmlFor="challenge-name"
            className="flex flex-col gap-1"
          >
            <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Name
            </span>
            <input
              id="challenge-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              maxLength={80}
              autoFocus
              placeholder="e.g., Bandit Chief"
              className="rounded-lg border border-mist-light bg-parchment-elevated px-3 py-2 text-sm text-ink-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
            />
          </label>

          <div className="flex flex-col gap-1">
            <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Role
            </span>
            <RolePicker value={role} onChange={setRole} disabled={pending} />
          </div>

          <div className="flex flex-col gap-1">
            <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Might level
            </span>
            <MightPicker
              value={mightLevel}
              onChange={setMightLevel}
              disabled={pending}
            />
          </div>
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
          <Button
            type="button"
            disabled={pending || name.trim().length === 0}
            onClick={submit}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
