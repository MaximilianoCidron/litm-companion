"use client";
import { useMemo } from "react";
import { Dices, Shield } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useCharacter } from "../CharacterProvider";
import { useCampaign } from "../CampaignProvider";
import { computePower } from "../../lib/power-calc";
import {
  useInvokedStatuses,
  useInvokedTags,
  useIsReaction,
  useMightModifier,
  useRollBuilder,
} from "../../stores/roll-builder";
import type {
  StatusInvocationInput,
  StatusId,
  TagInvocationInput,
} from "../../schemas";

export function DesktopTrigger() {
  const { character } = useCharacter();
  const campaign = useCampaign();
  const liveCampaign =
    campaign.status === "live" ? campaign.campaign : null;
  const engagedChallenges =
    campaign.status === "none" ? [] : campaign.engagedChallenges;
  const invokedTags = useInvokedTags();
  const invokedStatuses = useInvokedStatuses();
  const mightModifier = useMightModifier();
  const isReaction = useIsReaction();
  const setExpanded = useRollBuilder((s) => s.setExpanded);

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
    ).map((id) => ({ statusId: id as StatusId }));
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

  const hasSelection =
    invokedTags.size > 0 || invokedStatuses.size > 0 || mightModifier !== 0;

  return (
    <button
      type="button"
      onClick={() => setExpanded(true)}
      aria-label="Open roll builder"
      className={cn(
        "fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 md:flex",
        "flex-col items-center gap-2 rounded-l-md bg-ink-muted px-3 py-4 text-parchment-elevated shadow-[inset_6px_0_8px_-6px_rgba(0,0,0,0.25)]",
        "transition-transform hover:-translate-x-1",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ember",
      )}
    >
      {isReaction ? (
        <Shield className="h-5 w-5" aria-hidden="true" />
      ) : (
        <Dices className="h-5 w-5" aria-hidden="true" />
      )}
      <span
        className="font-display text-xs uppercase tracking-wider"
        style={{
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
        }}
      >
        {isReaction ? "Reaction" : "Roll"}
      </span>
      {hasSelection ? (
        <span className="numeric font-display text-sm">
          {total > 0 ? `+${total}` : total}
        </span>
      ) : null}
    </button>
  );
}
