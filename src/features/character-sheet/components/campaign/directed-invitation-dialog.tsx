// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  toast,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { createDirectedInvitation } from "../../actions";
import type { CampaignId } from "../../schemas";

interface DirectedInvitationDialogProps {
  trigger: React.ReactNode;
  campaignId: CampaignId;
}

export function DirectedInvitationDialog({
  trigger,
  campaignId,
}: DirectedInvitationDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callAction = useActionWithToast();

  const reset = () => {
    setEmail("");
    setError(null);
  };

  const submit = async () => {
    setError(null);
    setPending(true);
    const result = await callAction(
      createDirectedInvitation({ campaignId, targetEmail: email.trim() }),
      { onError: (message) => setError(message) },
    );
    setPending(false);
    if (!result) return;
    toast.success(`Invitation sent to ${result.directedAtEmail}.`);
    setOpen(false);
    reset();
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a player by email</DialogTitle>
          <DialogDescription>
            They&apos;ll see this invitation on their dashboard and pick a
            hero to bring.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          <label
            htmlFor="directed-invite-email"
            className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle"
          >
            Player&apos;s email
          </label>
          <input
            id="directed-invite-email"
            type="email"
            autoComplete="off"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
            placeholder="alice@example.com"
            className="h-10 rounded border border-mist-light bg-parchment-elevated px-3 text-sm text-ink-base focus:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
          />
          {error ? (
            <p
              role="alert"
              className="text-xs text-crimson dark:text-crimson-dark"
            >
              {error}
            </p>
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
            disabled={pending || email.trim().length === 0}
            onClick={submit}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
