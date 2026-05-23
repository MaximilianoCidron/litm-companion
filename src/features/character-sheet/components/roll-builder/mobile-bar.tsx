"use client";
import { useMemo } from "react";
import { useCharacter } from "../CharacterProvider";
import { useCampaign } from "../CampaignProvider";
import {
  useInvokedStatuses,
  useInvokedTags,
  useIsReaction,
  useMightModifier,
  useRollBuilder,
} from "../../stores/roll-builder";
import { computePower } from "../../lib/power-calc";
import { cn } from "@/shared/lib/cn";
import { Dices, Shield } from "lucide-react";
import type { StatusInvocationInput, TagInvocationInput } from "../../schemas";

export function MobileBar() {
  const { character } = useCharacter();
  const campaign = useCampaign();
  const invokedTags = useInvokedTags();
  const invokedStatuses = useInvokedStatuses();
  const mightModifier = useMightModifier();
  const isReaction = useIsReaction();
  const setExpanded = useRollBuilder((s) => s.setExpanded);
  const liveCampaign =
    campaign.status === "live" ? campaign.campaign : null;
  const engagedChallenges =
    campaign.status === "none" ? [] : campaign.engagedChallenges;

  const total = useMemo(() => {
    const tags: TagInvocationInput[] = Array.from(invokedTags.values()).map(
      (entry) => ({
        tagId: entry.tagId,
        location: entry.location,
        burn: entry.burn,
      }),
    );
    const statuses: StatusInvocationInput[] = Array.from(
      invokedStatuses.values(),
    ).map((entry) => ({ statusId: entry.statusId, location: entry.location }));
    const engagedMap = new Map(engagedChallenges.map((e) => [e.id, e]));
    return computePower(
      character,
      liveCampaign,
      engagedMap,
      { tags, statuses },
      mightModifier,
    ).total;
  }, [
    character,
    liveCampaign,
    engagedChallenges,
    invokedTags,
    invokedStatuses,
    mightModifier,
  ]);

  return (
    <button
      type="button"
      onClick={() => setExpanded(true)}
      aria-label="Open roll builder"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 flex h-14 items-center justify-between gap-3 px-3 md:hidden",
        "bg-ink-muted text-parchment-elevated shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.3)]",
      )}
    >
      <span className="inline-flex items-center gap-2 text-sm">
        {isReaction ? (
          <Shield className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Dices className="h-4 w-4" aria-hidden="true" />
        )}
        <span className="font-display text-xs uppercase tracking-wider">
          {isReaction ? "Reaction" : "Roll"}
        </span>
      </span>
      <span className="numeric font-display text-base">
        Power {total > 0 ? `+${total}` : total}
      </span>
      <span className="inline-flex items-center gap-1 text-sm font-display">
        Open →
      </span>
    </button>
  );
}
