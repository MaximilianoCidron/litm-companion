// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { useCampaign } from "../CampaignProvider";
import { FellowshipDisplay } from "../fellowship/fellowship-display";
import { ChallengesPanel } from "./challenges";
import { InvitationsPanel } from "./invitations-panel";
import { RosterView } from "./roster-view";
import { SettingsPanel } from "./settings-panel";

interface CampaignPageShellProps {
  currentUid: string;
}

export function CampaignPageShell({ currentUid }: CampaignPageShellProps) {
  const campaign = useCampaign();

  if (campaign.status === "none") {
    return (
      <div className="p-6 md:p-10">
        <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
          Campaign unavailable.
        </p>
      </div>
    );
  }

  const live = campaign.status === "live" ? campaign.campaign : campaign.campaign;
  if (!live) {
    return (
      <div className="p-6 md:p-10">
        <p className="text-sm text-crimson dark:text-crimson-dark">
          Couldn&apos;t load this campaign.
        </p>
      </div>
    );
  }

  const role = campaign.role ?? "member";
  const isGm = role === "gm";

  return (
    <div className="flex flex-col gap-6 p-6 md:p-10">
      <header className="flex flex-col gap-1">
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Fellowship
        </span>
        <h1 className="font-display text-3xl text-ink-base dark:text-parchment-base">
          {live.name}
        </h1>
        {isGm ? (
          <p className="text-xs font-display uppercase tracking-wider text-ember">
            You are the GM
          </p>
        ) : null}
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <FellowshipDisplay campaign={live} canEdit={isGm} />
        <RosterView campaignId={live.id} />
        {isGm ? <InvitationsPanel campaignId={live.id} /> : null}
        <SettingsPanel
          campaign={live}
          role={role}
          currentUid={currentUid}
        />
        {isGm ? (
          <div className="lg:col-span-2">
            <ChallengesPanel />
          </div>
        ) : null}
      </div>
    </div>
  );
}
