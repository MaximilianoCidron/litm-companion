// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { Copy, Link as LinkIcon, Mail, X } from "lucide-react";
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
import { DirectedInvitationDialog } from "./directed-invitation-dialog";

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
        <div className="flex w-full flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-base tracking-tight">
            Open invitations
          </h3>
          <div className="flex flex-wrap items-center gap-1">
            <CreateInvitationDialog
              campaignId={campaignId}
              trigger={
                <Button variant="primary" size="sm">
                  <LinkIcon className="h-4 w-4" aria-hidden="true" />
                  Invite link
                </Button>
              }
            />
            <DirectedInvitationDialog
              campaignId={campaignId}
              trigger={
                <Button variant="secondary" size="sm">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                  Invite by email
                </Button>
              }
            />
          </div>
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
  const label =
    invitation.kind === "directed"
      ? `directed invite for ${invitation.directedAtEmail}`
      : `invite link ${invitation.id.slice(0, 8)}`;

  return (
    <li className="flex items-center gap-3 py-2 text-sm">
      {invitation.kind === "directed" ? (
        <DirectedRowBody invitation={invitation} />
      ) : (
        <TokenRowBody invitation={invitation} />
      )}
      <div className="ml-auto flex items-center gap-1">
        {invitation.kind === "token" ? (
          <CopyTokenButton invitationId={invitation.id} />
        ) : null}
        <ConfirmDialog
          trigger={
            <button
              type="button"
              aria-label={`Revoke ${label}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded text-ink-muted hover:bg-parchment-elevated hover:text-crimson focus:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:text-parchment-muted dark:hover:bg-ink-elevated"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          }
          title="Revoke this invite?"
          description={
            invitation.kind === "directed" ? (
              <>
                {invitation.directedAtName ?? invitation.directedAtEmail} will
                no longer see this invitation.
              </>
            ) : (
              <>
                Anyone holding this link will no longer be able to redeem it.
              </>
            )
          }
          confirmLabel="Revoke"
          variant="destructive"
          onConfirm={onRevoke}
        />
      </div>
    </li>
  );
}

function TokenRowBody({
  invitation,
}: {
  invitation: Extract<Invitation, { kind: "token" }>;
}) {
  const tokenPreview = invitation.id.slice(0, 8);
  return (
    <>
      <LinkIcon
        className="h-4 w-4 shrink-0 text-ink-muted dark:text-parchment-muted"
        aria-hidden="true"
      />
      <code className="font-mono text-ink-muted dark:text-parchment-muted">
        {tokenPreview}…
      </code>
      <span className="text-xs text-ink-subtle dark:text-parchment-subtle">
        expires in {formatCountdown(invitation.expiresAt)}
      </span>
    </>
  );
}

function DirectedRowBody({
  invitation,
}: {
  invitation: Extract<Invitation, { kind: "directed" }>;
}) {
  return (
    <>
      <Mail
        className="h-4 w-4 shrink-0 text-ember"
        aria-hidden="true"
      />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-ink-base dark:text-parchment-base">
          Invited{" "}
          <span className="font-medium">
            {invitation.directedAtName ?? invitation.directedAtEmail}
          </span>
        </span>
        <span className="text-xs text-ink-subtle dark:text-parchment-subtle">
          {invitation.directedAtName ? invitation.directedAtEmail + " · " : ""}
          expires in {formatCountdown(invitation.expiresAt)}
        </span>
      </div>
    </>
  );
}

function CopyTokenButton({ invitationId }: { invitationId: string }) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${invitationId}`
      : `/invite/${invitationId}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Invite link copied");
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy invite ${invitationId.slice(0, 8)}`}
      className="inline-flex h-9 w-9 items-center justify-center rounded text-ink-muted hover:bg-parchment-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:text-parchment-muted dark:hover:bg-ink-elevated"
    >
      <Copy className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}
