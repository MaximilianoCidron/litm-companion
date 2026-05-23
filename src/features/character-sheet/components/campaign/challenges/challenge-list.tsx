"use client";

import { ChallengeCard } from "./challenge-card";
import type { Challenge } from "../../../schemas";

interface ChallengeListProps {
  campaignId: string;
  challenges: readonly Challenge[];
}

export function ChallengeList({ campaignId, challenges }: ChallengeListProps) {
  if (challenges.length === 0) {
    return (
      <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
        No challenges yet. Forge a hazard or NPC the party will face.
      </p>
    );
  }
  return (
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {challenges.map((challenge) => (
        <li key={challenge.id}>
          <ChallengeCard
            campaignId={campaignId}
            challenge={{
              id: challenge.id,
              name: challenge.name,
              role: challenge.role,
              mightLevel: challenge.mightLevel,
              threatCount: challenge.threats.length,
              limitCount: challenge.limits.length,
            }}
          />
        </li>
      ))}
    </ul>
  );
}
