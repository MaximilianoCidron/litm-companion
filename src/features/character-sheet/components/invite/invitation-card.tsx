// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { useState } from "react";
import { Button, Card, ConfirmDialog } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { formatRelativeTime } from "@/shared/lib/format";
import { declineDirectedInvitation } from "../../actions";
import type { DirectedInvitation } from "../../hooks/use-incoming-invitations";
import { AcceptInvitationDialog } from "./accept-invitation-dialog";

interface InvitationCardProps {
  invitation: DirectedInvitation;
  currentUid: string;
}

export function InvitationCard({
  invitation,
  currentUid,
}: InvitationCardProps) {
  const [open, setOpen] = useState(false);
  const callAction = useActionWithToast();

  return (
    <Card className="border-l-4 border-l-ember">
      <Card.Body className="flex flex-col gap-2">
        <p className="text-sm">
          <span className="font-medium">
            {invitation.invitedByName || "Someone"}
          </span>
          <span className="text-ink-muted dark:text-parchment-muted">
            {" invites you to join "}
          </span>
          <span className="font-medium">
            &ldquo;{invitation.campaignName}&rdquo;
          </span>
        </p>
        <p className="text-xs text-ink-subtle dark:text-parchment-subtle">
          Expires {formatRelativeTime(invitation.expiresAt)}
        </p>
        <div className="mt-1 flex gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setOpen(true)}
          >
            Accept
          </Button>
          <ConfirmDialog
            trigger={
              <Button type="button" variant="ghost" size="sm">
                Decline
              </Button>
            }
            title="Decline this invitation?"
            description={
              <>
                You&apos;re declining to join &ldquo;{invitation.campaignName}
                &rdquo;. The invitation will disappear for everyone.
              </>
            }
            confirmLabel="Decline"
            variant="destructive"
            onConfirm={async () => {
              await callAction(
                declineDirectedInvitation({ invitationId: invitation.id }),
                { onSuccess: "Invitation declined" },
              );
            }}
          />
        </div>
      </Card.Body>
      <AcceptInvitationDialog
        open={open}
        onOpenChange={setOpen}
        invitation={invitation}
        currentUid={currentUid}
      />
    </Card>
  );
}
