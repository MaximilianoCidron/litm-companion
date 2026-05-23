"use client";

import { useCampaign } from "../../CampaignProvider";
import type { CampaignId, Session } from "../../../schemas";
import { SessionListItem } from "./list-item";

interface SessionListViewProps {
  campaignId: CampaignId;
  sessions: readonly Session[];
}

export function SessionListView({
  campaignId,
  sessions,
}: SessionListViewProps) {
  const campaign = useCampaign();
  const activeSessionId =
    campaign.status === "live"
      ? campaign.campaign.activeSessionId
      : campaign.status === "error" && campaign.campaign
        ? campaign.campaign.activeSessionId
        : null;

  const active = sessions.find((s) => s.id === activeSessionId) ?? null;
  const past = sessions.filter((s) => s.id !== activeSessionId);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 p-6 md:p-8">
      <header>
        <h1 className="font-display text-2xl text-ink-base dark:text-parchment-base">
          Sessions
        </h1>
        <p className="mt-1 text-sm text-ink-muted dark:text-parchment-muted">
          {sessions.length === 0
            ? "No sessions yet."
            : `${sessions.length} session${sessions.length === 1 ? "" : "s"}`}
        </p>
      </header>

      {active ? (
        <section>
          <h2 className="mb-2 font-display text-xs uppercase tracking-wider text-moss-text dark:text-moss-text-dark">
            In progress
          </h2>
          <SessionListItem
            campaignId={campaignId}
            session={active}
            isActive
          />
        </section>
      ) : null}

      {past.length > 0 ? (
        <section>
          <h2 className="mb-2 font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
            Past sessions
          </h2>
          <div className="flex flex-col gap-2">
            {past.map((s) => (
              <SessionListItem key={s.id} campaignId={campaignId} session={s} />
            ))}
          </div>
        </section>
      ) : null}

      {sessions.length === 0 ? (
        <p className="py-8 text-center text-sm italic text-ink-subtle dark:text-parchment-subtle">
          The first session begins when the GM starts one.
        </p>
      ) : null}
    </div>
  );
}
