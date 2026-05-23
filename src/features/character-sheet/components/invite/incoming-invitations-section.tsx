// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { Mail } from "lucide-react";
import { useIncomingInvitations } from "../../hooks/use-incoming-invitations";
import { InvitationCard } from "./invitation-card";

interface IncomingInvitationsSectionProps {
  currentUid: string;
}

export function IncomingInvitationsSection({
  currentUid,
}: IncomingInvitationsSectionProps) {
  const invitations = useIncomingInvitations(currentUid);
  if (invitations.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="inline-flex items-center gap-2 font-display text-2xl text-ink-base dark:text-parchment-base">
        <Mail className="h-5 w-5 text-ember" aria-hidden="true" />
        Pending invitations
        <span className="numeric font-display text-sm text-ink-muted dark:text-parchment-muted">
          ({invitations.length})
        </span>
      </h2>
      <div className="flex flex-col gap-3">
        {invitations.map((inv) => (
          <InvitationCard
            key={inv.id}
            invitation={inv}
            currentUid={currentUid}
          />
        ))}
      </div>
    </section>
  );
}
