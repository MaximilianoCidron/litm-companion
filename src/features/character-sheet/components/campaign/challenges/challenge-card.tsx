"use client";

import Link from "next/link";
import { Card } from "@/shared/ui";
import { formatMight, formatRole } from "../../challenge/helpers";
import type { ChallengeSummary } from "../../../schemas";

interface ChallengeCardProps {
  campaignId: string;
  challenge: ChallengeSummary;
}

export function ChallengeCard({ campaignId, challenge }: ChallengeCardProps) {
  return (
    <Link
      href={`/campaigns/${campaignId}/challenges/${challenge.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ember rounded-lg"
      aria-label={`Open ${challenge.name}`}
    >
      <Card variant="interactive">
        <Card.Body className="flex flex-col gap-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base text-ink-base dark:text-parchment-base">
              {challenge.name}
            </h3>
            <span className="rounded-full bg-ember/15 px-2 py-0.5 font-display text-[10px] uppercase tracking-wider text-ember-text-light dark:text-ember-text-dark">
              {formatRole(challenge.role)}
            </span>
          </div>
          <p className="text-xs text-ink-subtle dark:text-parchment-subtle">
            {formatMight(challenge.mightLevel)} · {challenge.threatCount} threat
            {challenge.threatCount === 1 ? "" : "s"} · {challenge.limitCount}{" "}
            limit{challenge.limitCount === 1 ? "" : "s"}
          </p>
        </Card.Body>
      </Card>
    </Link>
  );
}
