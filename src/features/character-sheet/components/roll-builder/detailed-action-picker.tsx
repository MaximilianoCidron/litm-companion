"use client";
import { Target, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useCampaign } from "../CampaignProvider";
import {
  useDetailedActionChallengeId,
  useReactingToPendingThreatId,
  useRollBuilder,
} from "../../stores/roll-builder";

export function DetailedActionPicker() {
  const campaign = useCampaign();
  const detailedChallengeId = useDetailedActionChallengeId();
  const reactingToPendingThreatId = useReactingToPendingThreatId();
  const setDetailedAction = useRollBuilder((s) => s.setDetailedAction);

  const eligible =
    campaign.status === "none"
      ? []
      : campaign.engagedChallenges.filter((c) => c.limits.length > 0);

  // Hide entirely when no eligible challenges OR when in reaction mode
  // (mutually exclusive at the store level too — defensive UI hide).
  if (eligible.length === 0) return null;
  if (reactingToPendingThreatId) return null;

  const selected = detailedChallengeId
    ? (eligible.find((c) => c.id === detailedChallengeId) ?? null)
    : null;

  return (
    <div className="m-3 rounded-md border border-mist-light bg-parchment-soft p-2 dark:border-mist-dark dark:bg-ink-soft">
      {selected ? (
        <div className="flex items-center gap-2">
          <Target
            className="h-4 w-4 text-rust-text dark:text-rust-text-dark"
            aria-hidden="true"
          />
          <span className="text-xs text-ink-base dark:text-parchment-base">
            Detailed action against{" "}
            <span className="font-display">{selected.name}</span>
          </span>
          <button
            type="button"
            aria-label="Clear Detailed action target"
            onClick={() => setDetailedAction(null, null)}
            className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded text-ink-muted hover:bg-mist-light hover:text-ink-base dark:text-parchment-muted dark:hover:bg-mist-dark dark:hover:text-parchment-base"
          >
            <X className="h-3 w-3" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ink-muted dark:text-parchment-muted">
            Detailed action against:
          </span>
          {eligible.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setDetailedAction(c.id, c.campaignId)}
              className={cn(
                "rounded bg-parchment-elevated px-2 py-1 text-xs transition-colors",
                "hover:bg-rust-soft hover:text-rust-text",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                "dark:bg-ink-elevated dark:hover:bg-rust-soft-dark dark:hover:text-rust-text-dark",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
