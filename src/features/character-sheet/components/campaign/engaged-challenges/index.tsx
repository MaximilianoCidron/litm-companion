"use client";
import { useCampaign } from "../../CampaignProvider";
import { EngagedChallengeCard } from "./challenge-card";

export function EngagedChallengesSection() {
  const campaign = useCampaign();
  if (campaign.status === "none") return null;
  const engaged = campaign.engagedChallenges;
  if (engaged.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <header className="flex items-baseline justify-between gap-2">
        <h2 className="font-display text-lg text-ink-base dark:text-parchment-base">
          Engaged challenges
        </h2>
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          {engaged.length} active
        </span>
      </header>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {engaged.map((c) => (
          <EngagedChallengeCard key={c.id} challenge={c} />
        ))}
      </div>
    </section>
  );
}
