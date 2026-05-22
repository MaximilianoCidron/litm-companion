"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { createCampaign } from "../../actions";
import type { CharacterId } from "../../schemas";

interface CreateCampaignDialogProps {
  trigger: React.ReactNode;
  characterId?: CharacterId;
}

export function CreateCampaignDialog({
  trigger,
  characterId,
}: CreateCampaignDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [joinSelf, setJoinSelf] = useState(true);
  const [pending, setPending] = useState(false);
  const callAction = useActionWithToast();

  const reset = () => {
    setName("");
    setJoinSelf(true);
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPending(true);
    const result = await callAction(
      createCampaign({
        name: trimmed,
        joinCharacterId:
          characterId && joinSelf ? characterId : undefined,
      }),
      { onSuccess: "Fellowship started" },
    );
    setPending(false);
    if (result) {
      setOpen(false);
      reset();
    }
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
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Start a fellowship</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Campaign name
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              placeholder="The Mistward Pact…"
              maxLength={80}
              disabled={pending}
              autoFocus
              className="border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm text-ink-base placeholder:text-ink-subtle focus:border-ember focus:outline-none dark:border-mist-dark dark:text-parchment-base dark:placeholder:text-parchment-subtle"
            />
          </label>
          {characterId ? (
            <label className="flex items-center gap-2 text-sm text-ink-base dark:text-parchment-base">
              <input
                type="checkbox"
                checked={joinSelf}
                onChange={(e) => setJoinSelf(e.currentTarget.checked)}
                disabled={pending}
                className="h-4 w-4 rounded border-mist-light accent-ember dark:border-mist-dark"
              />
              <span>Add this hero to the campaign</span>
            </label>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={pending || name.trim().length === 0}
            onClick={submit}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Start fellowship
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
