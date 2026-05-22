// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { useMemo, useState } from "react";
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
import { cn } from "@/shared/lib/cn";
import { transferGm } from "../../actions";
import type { Campaign, Character } from "../../schemas";

interface TransferGmDialogProps {
  trigger: React.ReactNode;
  campaign: Campaign;
  characters: Character[];
}

export function TransferGmDialog({
  trigger,
  campaign,
  characters,
}: TransferGmDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const callAction = useActionWithToast();

  // Group characters by their owner so the GM picks a *player*, not a
  // specific hero. A player can have multiple heroes in the party.
  const playerOptions = useMemo(() => {
    const seen = new Map<
      string,
      { playerUid: string; characterNames: string[] }
    >();
    for (const entry of campaign.roster) {
      if (entry.playerUid === campaign.gmUid) continue;
      const bucket = seen.get(entry.playerUid);
      if (bucket) {
        bucket.characterNames.push(entry.characterName);
      } else {
        seen.set(entry.playerUid, {
          playerUid: entry.playerUid,
          characterNames: [entry.characterName],
        });
      }
    }
    // characters arg is used only for symmetry — could surface additional
    // fields here later (avatars, last-active). For now the roster snapshot
    // on the campaign doc is the authoritative source.
    return Array.from(seen.values());
  }, [campaign.gmUid, campaign.roster, characters]);

  const submit = async () => {
    if (!selectedUid) return;
    setPending(true);
    const result = await callAction(
      transferGm({
        campaignId: campaign.id,
        newGmUid: selectedUid,
      }),
      { onSuccess: "GM transferred" },
    );
    setPending(false);
    if (result) {
      setOpen(false);
      setSelectedUid(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setSelectedUid(null);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Transfer GM role</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          {playerOptions.length === 0 ? (
            <p className="text-sm italic text-ink-muted dark:text-parchment-muted">
              No other players in the fellowship yet. Invite someone first.
            </p>
          ) : (
            <div
              className="flex flex-col gap-2"
              role="radiogroup"
              aria-label="Choose the new GM"
            >
              {playerOptions.map((player) => (
                <button
                  key={player.playerUid}
                  type="button"
                  role="radio"
                  aria-checked={selectedUid === player.playerUid}
                  onClick={() => setSelectedUid(player.playerUid)}
                  disabled={pending}
                  className={cn(
                    "rounded border px-3 py-2 text-left text-sm transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                    selectedUid === player.playerUid
                      ? "border-ember bg-ember/10"
                      : "border-mist-light hover:border-ember/60 dark:border-mist-dark",
                  )}
                >
                  <span className="block font-display">
                    {player.characterNames.join(", ")}
                  </span>
                  <span className="block text-xs text-ink-subtle dark:text-parchment-subtle">
                    Player uid: {player.playerUid.slice(0, 8)}…
                  </span>
                </button>
              ))}
            </div>
          )}
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
            disabled={pending || !selectedUid}
            onClick={submit}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
