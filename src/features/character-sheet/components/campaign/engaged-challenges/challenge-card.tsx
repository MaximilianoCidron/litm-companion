"use client";
import { Card } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { EngagedChallenge } from "../../../schemas";
import { StatusList } from "./status-list";
import { LimitList } from "./limit-list";

interface EngagedChallengeCardProps {
  challenge: EngagedChallenge;
}

export function EngagedChallengeCard({ challenge }: EngagedChallengeCardProps) {
  const activeTags = challenge.tags.filter((t) => !t.scratched);
  return (
    <Card>
      <Card.Body className="flex flex-col gap-3">
        <header>
          <h3 className="font-display text-base text-ink-base dark:text-parchment-base">
            {challenge.name}
          </h3>
        </header>
        {activeTags.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {activeTags.map((tag) => (
              <li
                key={tag.id}
                className={cn(
                  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
                  tag.polarity === "helpful"
                    ? "border-tag-power/40 bg-tag-power-soft text-tag-power-text dark:border-tag-power-dark/40 dark:bg-tag-power-soft-dark dark:text-tag-power-text-dark"
                    : "border-tag-weakness/40 bg-tag-weakness-soft text-tag-weakness-text dark:border-tag-weakness-dark/40 dark:bg-tag-weakness-soft-dark dark:text-tag-weakness-text-dark",
                )}
              >
                {tag.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs italic text-ink-subtle dark:text-parchment-subtle">
            No active tags.
          </p>
        )}
        {challenge.statuses.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Statuses
            </span>
            <StatusList statuses={challenge.statuses} />
          </div>
        ) : null}
        {challenge.limits.length > 0 ? (
          <div className="flex flex-col gap-1">
            <span className="font-display text-[10px] uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Limits
            </span>
            <LimitList limits={challenge.limits} />
          </div>
        ) : null}
      </Card.Body>
    </Card>
  );
}
