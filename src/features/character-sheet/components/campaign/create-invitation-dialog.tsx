// TODO(refactor): promote campaign subdomain to its own feature.
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
  toast,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { cn } from "@/shared/lib/cn";
import { createInvitation } from "../../actions";
import type { CampaignId } from "../../schemas";

interface CreateInvitationDialogProps {
  trigger: React.ReactNode;
  campaignId: CampaignId;
}

const EXPIRY_OPTIONS = [1, 3, 7, 14] as const;

export function CreateInvitationDialog({
  trigger,
  campaignId,
}: CreateInvitationDialogProps) {
  const [open, setOpen] = useState(false);
  const [expiresInDays, setExpiresInDays] = useState<
    (typeof EXPIRY_OPTIONS)[number]
  >(7);
  const [pending, setPending] = useState(false);
  const callAction = useActionWithToast();

  const submit = async () => {
    setPending(true);
    const result = await callAction(
      createInvitation({ campaignId, expiresInDays }),
    );
    setPending(false);
    if (!result) return;

    try {
      const url = `${window.location.origin}/invite/${result.invitationId}`;
      await navigator.clipboard.writeText(url);
      toast.success("Invite created and copied to clipboard");
    } catch {
      toast.success("Invite created");
    }
    setOpen(false);
    setExpiresInDays(7);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Create an invite</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <p className="text-sm text-ink-muted dark:text-parchment-muted">
            Anyone with the link can join your fellowship until the invite is
            consumed, revoked, or expires.
          </p>
          <div
            className="flex flex-col gap-2 text-sm"
            role="radiogroup"
            aria-label="Expires in"
          >
            <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Expires in
            </span>
            <div className="flex gap-1">
              {EXPIRY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="radio"
                  aria-checked={expiresInDays === d}
                  onClick={() => setExpiresInDays(d)}
                  disabled={pending}
                  className={cn(
                    "h-10 rounded px-3 text-sm font-medium transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                    expiresInDays === d
                      ? "bg-ember text-parchment-elevated"
                      : "text-ink-muted hover:bg-parchment-elevated dark:text-parchment-muted dark:hover:bg-ink-elevated",
                  )}
                >
                  {d} {d === 1 ? "day" : "days"}
                </button>
              ))}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button variant="primary" disabled={pending} onClick={submit}>
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Create invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
