// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { useEffect, useRef } from "react";
import { Mail } from "lucide-react";
import { toast } from "@/shared/ui";
import { useIncomingInvitations } from "../../hooks/use-incoming-invitations";
import { useUserSettings } from "../UserSettingsProvider";
import { InvitationCard } from "./invitation-card";

interface IncomingInvitationsSectionProps {
  currentUid: string;
}

export function IncomingInvitationsSection({
  currentUid,
}: IncomingInvitationsSectionProps) {
  const invitations = useIncomingInvitations(currentUid);
  const showInvitationToasts = useUserSettings().showInvitationToasts;
  const seenIds = useRef<Set<string> | null>(null);

  // Fire a toast for newly-arrived invitations; the first snapshot seeds the
  // ref without toasting (so re-mounts on existing invitations stay quiet).
  useEffect(() => {
    if (seenIds.current === null) {
      seenIds.current = new Set(invitations.map((i) => i.id));
      return;
    }
    const prev = seenIds.current;
    const arrivals = invitations.filter((i) => !prev.has(i.id));
    for (const inv of arrivals) {
      prev.add(inv.id);
      if (showInvitationToasts) {
        toast.success(
          `${inv.invitedByName || "Someone"} invited you to "${inv.campaignName}".`,
        );
      }
    }
    // Drop ids that disappeared (declined, expired) so a re-arrival re-toasts.
    const currentIds = new Set<string>(invitations.map((i) => i.id));
    for (const id of Array.from(prev)) {
      if (!currentIds.has(id)) prev.delete(id);
    }
  }, [invitations, showInvitationToasts]);

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
