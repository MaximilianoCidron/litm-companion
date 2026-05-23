// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
} from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { redeemDirectedInvitation } from "../../actions";
import { useMyActiveCharacters } from "../../hooks/use-my-active-characters";
import type { CharacterId } from "../../schemas";
import type { DirectedInvitation } from "../../hooks/use-incoming-invitations";

interface AcceptInvitationDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  invitation: DirectedInvitation;
  currentUid?: string;
}

export function AcceptInvitationDialog({
  open,
  onOpenChange,
  invitation,
  currentUid,
}: AcceptInvitationDialogProps) {
  const characters = useMyActiveCharacters(currentUid ?? null);
  const router = useRouter();
  const callAction = useActionWithToast();
  const [pending, setPending] = useState(false);
  const [chosenCharacterId, setChosenCharacterId] =
    useState<CharacterId | null>(null);

  const available = characters.filter(
    (c) => !c.campaignIds.includes(invitation.campaignId),
  );

  const submit = async () => {
    if (!chosenCharacterId) return;
    setPending(true);
    const result = await callAction(
      redeemDirectedInvitation({
        invitationId: invitation.id,
        characterId: chosenCharacterId,
      }),
      { onSuccess: `Joined "${invitation.campaignName}".` },
    );
    setPending(false);
    if (!result) return;
    onOpenChange(false);
    router.push(`/campaigns/${result.joinedCampaignId}`);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Join &ldquo;{invitation.campaignName}&rdquo;
          </DialogTitle>
          <DialogDescription>
            Pick a hero to bring into this campaign.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-2">
          {available.length === 0 ? (
            <p className="text-sm italic text-ink-muted dark:text-parchment-muted">
              You don&apos;t have any active heroes available to bring. Create
              one first.
            </p>
          ) : (
            <div
              role="radiogroup"
              aria-label="Heroes"
              className="flex flex-col gap-1"
            >
              {available.map((c) => {
                const selected = chosenCharacterId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setChosenCharacterId(c.id)}
                    disabled={pending}
                    className={cn(
                      "flex flex-col items-start rounded border px-3 py-2 text-left transition-colors",
                      "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                      selected
                        ? "border-ember bg-ember/10"
                        : "border-mist-light hover:bg-parchment-soft dark:border-mist-dark dark:hover:bg-ink-soft",
                    )}
                  >
                    <span className="font-display text-sm text-ink-base dark:text-parchment-base">
                      {c.identity.name || "Unnamed hero"}
                    </span>
                    {c.identity.concept ? (
                      <span className="font-serif text-xs italic text-ink-muted dark:text-parchment-muted">
                        {c.identity.concept}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          <Button
            variant="ghost"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={pending || !chosenCharacterId}
            onClick={submit}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Join campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
