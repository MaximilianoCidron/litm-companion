"use client";

import { Clock } from "lucide-react";
import { useCampaign } from "../CampaignProvider";
import { GmPendingRow } from "./gm-pending-row";

/**
 * GM-side banner. Rendered above the campaign page shell. Lists every
 * active pending threat in the campaign with Resolve-now / Cancel controls.
 * Hides entirely when there are no active threats.
 */
export function GmPendingThreatBanner() {
  const campaign = useCampaign();
  if (campaign.status === "none") return null;
  if (campaign.role !== "gm") return null;
  const pending = campaign.pendingThreats;
  if (pending.length === 0) return null;

  return (
    <section
      role="status"
      aria-live="polite"
      className="mx-auto max-w-5xl rounded-lg border border-mist-light bg-parchment-elevated dark:border-mist-dark dark:bg-ink-elevated"
    >
      <header className="flex items-center gap-2 px-3 py-2">
        <Clock
          className="h-4 w-4 text-ink-muted dark:text-parchment-muted"
          aria-hidden="true"
        />
        <h2 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          Pending threats ({pending.length})
        </h2>
      </header>
      <ul>
        {pending.map((threat) => (
          <li key={threat.id}>
            <GmPendingRow threat={threat} />
          </li>
        ))}
      </ul>
    </section>
  );
}
