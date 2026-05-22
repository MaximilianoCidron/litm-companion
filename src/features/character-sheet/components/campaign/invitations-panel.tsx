// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { Copy, Plus, X } from "lucide-react";
import {
  Button,
  Card,
  ConfirmDialog,
  toast,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { useCampaignInvitations } from "../../hooks/use-campaign-invitations";
import { revokeInvitation } from "../../actions";
import type { CampaignId, Invitation } from "../../schemas";
import { CreateInvitationDialog } from "./create-invitation-dialog";

interface InvitationsPanelProps {
  campaignId: CampaignId;
}

function formatCountdown(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return `${hours}h`;
  const mins = Math.max(1, Math.floor(ms / (60 * 1000)));
  return `${mins}m`;
}

export function InvitationsPanel({ campaignId }: InvitationsPanelProps) {
  const { invitations, error } = useCampaignInvitations(campaignId);
  const callAction = useActionWithToast();

  return (
    <Card>
      <Card.Header>
        <div className="flex w-full items-center justify-between gap-2">
          <h3 className="font-display text-base tracking-tight">
            Open invitations
          </h3>
          <CreateInvitationDialog
            campaignId={campaignId}
            trigger={
              <Button variant="primary" size="sm">
                <Plus className="h-4 w-4" aria-hidden="true" />
                New invite
              </Button>
            }
          />
        </div>
      </Card.Header>
      <Card.Body>
        {error ? (
          <p className="text-sm text-crimson dark:text-crimson-dark">
            Couldn&apos;t load invitations.
          </p>
        ) : invitations.length === 0 ? (
          <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
            No active invites. Share an invite link to add party members.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-mist-light dark:divide-mist-dark">
            {invitations.map((inv) => (
              <InvitationRow
                key={inv.id}
                invitation={inv}
                onRevoke={async () => {
                  await callAction(
                    revokeInvitation({ invitationId: inv.id }),
                    { onSuccess: "Invite revoked" },
                  );
                }}
              />
            ))}
          </ul>
        )}
      </Card.Body>
    </Card>
  );
}

function InvitationRow({
  invitation,
  onRevoke,
}: {
  invitation: Invitation;
  onRevoke: () => Promise<void>;
}) {
  const tokenPreview = invitation.id.slice(0, 8);
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${invitation.id}`
      : `/invite/${invitation.id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <li className="flex items-center gap-3 py-2 text-sm">
      <code className="font-mono text-ink-muted dark:text-parchment-muted">
        {tokenPreview}…
      </code>
      <span className="text-xs text-ink-subtle dark:text-parchment-subtle">
        expires in {formatCountdown(invitation.expiresAt)}
      </span>
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy invite ${tokenPreview}`}
          className="inline-flex h-9 w-9 items-center justify-center rounded text-ink-muted hover:bg-parchment-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:text-parchment-muted dark:hover:bg-ink-elevated"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
        </button>
        <ConfirmDialog
          trigger={
            <button
              type="button"
              aria-label={`Revoke invite ${tokenPreview}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded text-ink-muted hover:bg-parchment-elevated hover:text-crimson focus:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:text-parchment-muted dark:hover:bg-ink-elevated"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          }
          title="Revoke this invite?"
          description={
            <>
              Anyone holding this link will no longer be able to redeem it.
            </>
          }
          confirmLabel="Revoke"
          variant="destructive"
          onConfirm={onRevoke}
        />
      </div>
    </li>
  );
}
