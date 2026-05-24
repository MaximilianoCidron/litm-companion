"use client";

import { useEffect, useRef } from "react";
import { toast } from "@/shared/ui";
import { useCampaign } from "../CampaignProvider";
import { useCharacter } from "../CharacterProvider";
import { useUserSettings } from "../UserSettingsProvider";
import { ReactionDecision } from "./reaction-decision";
import { ReactionAllocation } from "./reaction-allocation";

/**
 * Player-side banner. Rendered above the book-tab nav inside the character
 * layout. Filters the campaign's active pending threats to those targeting
 * the current character; shows the decision step (awaitingReaction) or the
 * allocation step (reactionRolled). Surfaces a transient toast on first
 * arrival when the user opts in via settings.
 */
export function PendingThreatBanner() {
  const campaign = useCampaign();
  const { character } = useCharacter();
  const showPendingThreatToasts = useUserSettings().showPendingThreatToasts;
  const seenIds = useRef<Set<string> | null>(null);

  const pending =
    campaign.status === "none"
      ? []
      : campaign.pendingThreats.filter(
          (t) => t.targetCharacterId === character.id,
        );

  useEffect(() => {
    if (seenIds.current === null) {
      seenIds.current = new Set(pending.map((p) => p.id));
      return;
    }
    const prev = seenIds.current;
    const arrivals = pending.filter((p) => !prev.has(p.id));
    for (const t of arrivals) {
      prev.add(t.id);
      if (showPendingThreatToasts) {
        toast.warning("Incoming consequence — see banner.");
      }
    }
    const currentIds = new Set<string>(pending.map((p) => p.id));
    for (const id of Array.from(prev)) {
      if (!currentIds.has(id)) prev.delete(id);
    }
  }, [pending, showPendingThreatToasts]);

  if (pending.length === 0) return null;
  return (
    <div className="flex flex-col">
      {pending.map((threat) => (
        <div key={threat.id}>
          {threat.status === "awaitingReaction" ? (
            <ReactionDecision threat={threat} />
          ) : threat.status === "reactionRolled" ? (
            <ReactionAllocation threat={threat} />
          ) : null}
        </div>
      ))}
    </div>
  );
}
