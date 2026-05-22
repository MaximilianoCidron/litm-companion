"use client";
import { Card } from "@/shared/ui";
import { useCharacter } from "../CharacterProvider";
import { useCampaign } from "../CampaignProvider";
import { FellowshipDisplay } from "../fellowship/fellowship-display";
import { RelationshipManager } from "../fellowship/relationship-manager";

export function FellowshipSection() {
  const { character, role } = useCharacter();
  const campaign = useCampaign();
  const canEdit = role === "owner" || role === "gm";

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
      <div>
        {campaign.status === "live" ? (
          <FellowshipDisplay campaign={campaign.campaign} />
        ) : campaign.status === "error" && campaign.campaign ? (
          <FellowshipDisplay campaign={campaign.campaign} />
        ) : (
          <Card>
            <Card.Header title="Fellowship" />
            <Card.Body className="flex flex-col items-center gap-3 text-center">
              <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
                This hero hasn&apos;t joined a fellowship yet.
              </p>
              <p className="text-sm text-ink-muted dark:text-parchment-muted">
                Open the Hero tab and start a fellowship.
              </p>
            </Card.Body>
          </Card>
        )}
      </div>
      <div>
        <RelationshipManager
          character={character}
          roster={
            campaign.status === "live" ? campaign.campaign.roster : []
          }
          canEdit={canEdit}
        />
      </div>
    </div>
  );
}
