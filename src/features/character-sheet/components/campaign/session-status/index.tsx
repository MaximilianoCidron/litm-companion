"use client";

import { Circle, PlayCircle } from "lucide-react";
import { useCampaign } from "../../CampaignProvider";
import { EndSessionDialog } from "./end-session-dialog";
import { StartSessionDialog } from "./start-session-dialog";

/**
 * Campaign-page header bar showing current session state. GM gets
 * start/end buttons; players see read-only status.
 */
export function SessionStatusBar() {
  const campaign = useCampaign();
  if (campaign.status === "none") return null;
  const live =
    campaign.status === "live" ? campaign.campaign : campaign.campaign;
  if (!live) return null;
  const isGm = campaign.role === "gm";
  const isActive = live.activeSessionId !== null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mist-light bg-parchment-soft px-4 py-2 dark:border-mist-dark dark:bg-ink-soft">
      <div className="flex items-center gap-2">
        {isActive ? (
          <>
            <PlayCircle className="h-4 w-4 text-moss" aria-hidden="true" />
            <span className="font-display text-sm text-ink-base dark:text-parchment-base">
              Session {live.activeSessionNumber} in progress
            </span>
          </>
        ) : (
          <>
            <Circle
              className="h-4 w-4 text-ink-subtle dark:text-parchment-subtle"
              aria-hidden="true"
            />
            <span className="font-display text-sm text-ink-muted dark:text-parchment-muted">
              No active session
            </span>
          </>
        )}
      </div>
      {isGm ? (
        isActive && live.activeSessionNumber !== null ? (
          <EndSessionDialog
            campaignId={live.id}
            sessionNumber={live.activeSessionNumber}
          />
        ) : (
          <StartSessionDialog campaignId={live.id} />
        )
      ) : null}
    </div>
  );
}
