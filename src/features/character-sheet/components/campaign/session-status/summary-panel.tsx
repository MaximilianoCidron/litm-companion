"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { Skeleton } from "@/shared/ui";
import { fetchEndOfSessionSummary } from "../../../actions";
import type { EndOfSessionSummary } from "../../../lib/queries";
import type { CampaignId } from "../../../schemas";

interface SummaryPanelProps {
  campaignId: CampaignId;
}

export function SummaryPanel({ campaignId }: SummaryPanelProps) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "live"; data: EndOfSessionSummary }
    | { status: "error"; message: string }
  >({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await fetchEndOfSessionSummary({ campaignId });
      if (cancelled) return;
      if (result.ok) {
        setState({ status: "live", data: result.data });
      } else {
        setState({ status: "error", message: result.error.message });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [campaignId]);

  if (state.status === "loading") {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-1/2" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  if (state.status === "error") {
    return (
      <p className="text-sm italic text-rust-text dark:text-rust-text-dark">
        Couldn&apos;t load summary: {state.message}
      </p>
    );
  }

  const { sessionStats, characters, campaign } = state.data;
  return (
    <div className="flex flex-col gap-4">
      {sessionStats ? (
        <section>
          <h3 className="mb-1 font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
            Session {sessionStats.sessionNumber}
          </h3>
          <p className="text-sm text-ink-base dark:text-parchment-base">
            {sessionStats.rollCount} roll
            {sessionStats.rollCount === 1 ? "" : "s"} ·{" "}
            {sessionStats.deliverThreatCount} threat
            {sessionStats.deliverThreatCount === 1 ? "" : "s"} ·{" "}
            {sessionStats.momentOfFulfillmentCount} MoF ·{" "}
            {sessionStats.campActionCount} camp action
            {sessionStats.campActionCount === 1 ? "" : "s"}
          </p>
        </section>
      ) : null}

      {characters.length > 0 ? (
        <section>
          <h3 className="mb-2 font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
            Character state
          </h3>
          <ul className="flex flex-col gap-3">
            {characters.map((c) => {
              const closeToMoF = c.promise === 4;
              return (
                <li
                  key={c.characterId}
                  className="rounded-lg border border-mist-light bg-parchment-elevated p-3 dark:border-mist-dark dark:bg-ink-elevated"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-display text-sm text-ink-base dark:text-parchment-base">
                      {c.name || "Unnamed hero"}
                    </span>
                    {c.momentOfFulfillmentReady ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ember/15 px-2 py-0.5 font-display text-[10px] uppercase tracking-wider text-ember-text-light dark:text-ember-text-dark">
                        <Sparkles className="h-3 w-3" aria-hidden="true" />
                        Moment of Fulfillment ready
                      </span>
                    ) : closeToMoF ? (
                      <span className="text-xs text-ember-text-light dark:text-ember-text-dark">
                        close to MoF
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-ink-muted dark:text-parchment-muted">
                    Promise {c.promise}/5 · {c.burnedTagCount} burned ·{" "}
                    {c.scratchedPowerTagCount} scratched
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {campaign.fellowshipScratchedCount > 0 ? (
        <section>
          <h3 className="mb-1 font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
            Fellowship
          </h3>
          <p className="text-sm text-ink-base dark:text-parchment-base">
            {campaign.fellowshipScratchedCount} fellowship power tag
            {campaign.fellowshipScratchedCount === 1 ? "" : "s"} scratched
          </p>
        </section>
      ) : null}
    </div>
  );
}
