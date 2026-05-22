"use client";
import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import { useCharacter } from "../CharacterProvider";
import { useCampaign } from "../CampaignProvider";
import {
  useInvokedStatuses,
  useInvokedTags,
  useMightModifier,
} from "../../stores/roll-builder";
import { computePower } from "../../lib/power-calc";
import type {
  StatusInvocationInput,
  StatusId,
  TagInvocationInput,
} from "../../schemas";

export function PowerSummary() {
  const { character } = useCharacter();
  const campaign = useCampaign();
  const invokedTags = useInvokedTags();
  const invokedStatuses = useInvokedStatuses();
  const mightModifier = useMightModifier();
  const liveCampaign =
    campaign.status === "live" ? campaign.campaign : null;

  const breakdown = useMemo(() => {
    const tags: TagInvocationInput[] = Array.from(invokedTags.values()).map(
      (entry) => ({
        tagId: entry.tagId,
        location: entry.location,
        burn: entry.burn,
      }),
    );
    const statuses: StatusInvocationInput[] = Array.from(
      invokedStatuses.values(),
    ).map((id) => ({ statusId: id as StatusId }));
    return computePower(
      character,
      liveCampaign,
      { tags, statuses },
      mightModifier,
    );
  }, [character, liveCampaign, invokedTags, invokedStatuses, mightModifier]);

  const sign = breakdown.total > 0 ? "+" : breakdown.total < 0 ? "" : "+";
  const isEmpty = breakdown.items.length === 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-sm uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          Power
        </span>
        <span className="numeric font-display text-2xl text-ink-base dark:text-parchment-base">
          {sign}
          {breakdown.total}
        </span>
      </div>
      {isEmpty ? (
        <p className="text-xs italic text-ink-subtle dark:text-parchment-subtle">
          Tap tags and statuses to build your roll.
        </p>
      ) : (
        <ul className="flex flex-col gap-1 border-t border-mist-light pt-2 text-sm dark:border-mist-dark">
          {breakdown.items.map((item, i) => (
            <li
              key={`${item.source}-${item.label}-${i}`}
              className="flex items-center justify-between gap-2"
            >
              <span className="flex flex-col">
                <span className="text-ink-base dark:text-parchment-base">
                  {item.label}
                </span>
                {item.detail ? (
                  <span className="text-[10px] uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
                    {item.detail}
                  </span>
                ) : null}
              </span>
              <span
                className={cn(
                  "numeric font-display",
                  item.value > 0
                    ? "text-moss-text dark:text-moss-text-dark"
                    : item.value < 0
                      ? "text-rust-text dark:text-rust-text-dark"
                      : "",
                )}
              >
                {item.value > 0 ? `+${item.value}` : item.value}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
