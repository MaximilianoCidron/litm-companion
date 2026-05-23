"use client";

import { useCampaign } from "../CampaignProvider";
import { useCharacter } from "../CharacterProvider";
import { ReactionDecision } from "./reaction-decision";
import { ReactionAllocation } from "./reaction-allocation";

/**
 * Player-side banner. Rendered above the book-tab nav inside the character
 * layout. Filters the campaign's active pending threats to those targeting
 * the current character; shows the decision step (awaitingReaction) or the
 * allocation step (reactionRolled).
 */
export function PendingThreatBanner() {
  const campaign = useCampaign();
  const { character } = useCharacter();
  if (campaign.status === "none") return null;
  const pending = campaign.pendingThreats.filter(
    (t) => t.targetCharacterId === character.id,
  );
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
