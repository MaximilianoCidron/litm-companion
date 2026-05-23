"use client";

import { useState } from "react";
import { Skeleton } from "@/shared/ui";
import { useCampaign } from "../../CampaignProvider";
import { useSessionLog } from "../../../hooks/use-session-log";
import { AnnotationComposer } from "./annotation-composer";
import { EntryList } from "./entry-list";
import { FilterBar } from "./filter-bar";
import { PinnedSection } from "./pinned-section";
import {
  applyFilter,
  summarizeCounts,
  type LogFilter,
} from "./helpers";

interface SessionLogViewProps {
  currentUid: string;
}

export function SessionLogView({ currentUid }: SessionLogViewProps) {
  const campaign = useCampaign();
  const [filter, setFilter] = useState<LogFilter>("all");

  if (campaign.status === "none") {
    return (
      <p className="p-6 text-sm italic text-ink-subtle dark:text-parchment-subtle">
        Campaign unavailable.
      </p>
    );
  }
  const live =
    campaign.status === "live" ? campaign.campaign : campaign.campaign;
  if (!live) {
    return (
      <p className="p-6 text-sm text-crimson dark:text-crimson-dark">
        Couldn&apos;t load this campaign.
      </p>
    );
  }
  const isGm = campaign.role === "gm";

  return <SessionLogInner campaignId={live.id} live={live} currentUid={currentUid} isGm={isGm} filter={filter} setFilter={setFilter} />;
}

function SessionLogInner({
  campaignId,
  live,
  currentUid,
  isGm,
  filter,
  setFilter,
}: {
  campaignId: import("../../../schemas").CampaignId;
  live: import("../../../schemas").Campaign;
  currentUid: string;
  isGm: boolean;
  filter: LogFilter;
  setFilter: (f: LogFilter) => void;
}) {
  const state = useSessionLog(campaignId);

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6 md:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const counts = summarizeCounts(state.entries);
  const pinned = state.entries.filter((e) => e.pinned);
  const chronological = state.entries.filter((e) => !e.pinned);
  const filtered = applyFilter(chronological, filter);
  const isEmpty = state.entries.length === 0;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
      <header>
        <h1 className="font-display text-2xl text-ink-base dark:text-parchment-base">
          Session log
        </h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-parchment-muted">
          A shared record of what happened — written by you, your party, and
          the world&apos;s pivot points.
        </p>
      </header>

      <AnnotationComposer campaignId={live.id} roster={live.roster} />

      <FilterBar value={filter} onChange={setFilter} counts={counts} />

      {state.status === "error" ? (
        <p className="text-xs italic text-rust-text dark:text-rust-text-dark">
          Connection issue — showing cached entries.
        </p>
      ) : null}

      <PinnedSection
        entries={pinned}
        campaign={live}
        currentUid={currentUid}
        isGm={isGm}
      />

      <EntryList
        entries={filtered}
        campaign={live}
        currentUid={currentUid}
        isGm={isGm}
        emptyMessage={
          isEmpty
            ? "No entries yet. Leave a note when something happens."
            : "No entries match this filter."
        }
      />

      <p className="pt-4 text-center text-xs text-ink-subtle dark:text-parchment-subtle">
        Showing the {Math.min(100, state.entries.length)} most recent entries.
      </p>
    </div>
  );
}
