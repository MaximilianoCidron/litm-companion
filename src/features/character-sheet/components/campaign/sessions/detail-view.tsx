"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { useCampaign } from "../../CampaignProvider";
import type { CampaignId, Campaign } from "../../../schemas";
import type { SessionDetail } from "../../../lib/queries";
import { SessionHeader } from "./session-header";
import { StatsPanel } from "./stats-panel";
import { SessionTimeline } from "./timeline";

interface SessionDetailViewProps {
  campaignId: CampaignId;
  currentUid: string;
  detail: SessionDetail;
}

export function SessionDetailView({
  campaignId,
  currentUid,
  detail,
}: SessionDetailViewProps) {
  const router = useRouter();
  const campaign = useCampaign();
  const liveCampaign: Campaign | null =
    campaign.status === "live"
      ? campaign.campaign
      : campaign.status === "error" && campaign.campaign
        ? campaign.campaign
        : null;
  const isGm = campaign.status !== "none" && campaign.role === "gm";
  const isActive = detail.session.endedAt === null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/campaigns/${campaignId}/sessions`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:underline dark:text-parchment-muted"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          Sessions
        </Link>
        {isActive ? (
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-1.5 text-xs text-ember-text-light hover:underline dark:text-ember-text-dark"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Refresh
          </button>
        ) : null}
      </div>

      <SessionHeader session={detail.session} isActive={isActive} />

      <StatsPanel
        stats={detail.stats}
        characterStats={detail.characterStats}
      />

      {liveCampaign ? (
        <SessionTimeline
          entries={detail.logEntries}
          campaign={liveCampaign}
          currentUid={currentUid}
          isGm={isGm}
        />
      ) : (
        <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
          Campaign unavailable — timeline hidden.
        </p>
      )}
    </div>
  );
}
