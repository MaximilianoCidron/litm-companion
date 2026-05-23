"use client";

import { Card } from "@/shared/ui";
import { useCampaign } from "../../CampaignProvider";
import { useChallenges } from "../../../hooks/use-challenges";
import type { CampaignId } from "../../../schemas";
import { ChallengeList } from "./challenge-list";
import { CreateChallengeDialog } from "./create-challenge-dialog";

export function ChallengesPanel() {
  const campaign = useCampaign();
  if (campaign.status === "none") return null;
  const live =
    campaign.status === "live" ? campaign.campaign : campaign.campaign;
  if (!live) return null;
  if (campaign.role !== "gm") return null;

  return <ChallengesPanelInner campaignId={live.id} />;
}

function ChallengesPanelInner({ campaignId }: { campaignId: CampaignId }) {
  const state = useChallenges(campaignId);
  return (
    <Card>
      <Card.Header>
        <div className="flex w-full items-center justify-between">
          <h3 className="font-display text-base tracking-tight">Challenges</h3>
          <CreateChallengeDialog campaignId={campaignId} />
        </div>
      </Card.Header>
      <Card.Body className="flex flex-col gap-3">
        <ChallengeList
          campaignId={campaignId}
          challenges={state.challenges}
        />
        {state.status === "error" ? (
          <p className="text-xs italic text-rust-text dark:text-rust-text-dark">
            Connection issue — showing cached data.
          </p>
        ) : null}
      </Card.Body>
    </Card>
  );
}
