import { notFound } from "next/navigation";
import { ActionError, getSessionUser } from "@/shared/auth";
import { getCampaignWithRoster } from "@/features/character-sheet/lib/queries";
import {
  CampaignProvider,
  RosterProvider,
} from "@/features/character-sheet";

export default async function CampaignLayout({
  params,
  children,
}: {
  params: Promise<{ campaignId: string }>;
  children: React.ReactNode;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();

  let campaign;
  let characters;
  try {
    const result = await getCampaignWithRoster(campaignId, user.uid);
    campaign = result.campaign;
    characters = result.characters;
  } catch (err) {
    if (err instanceof ActionError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  return (
    <CampaignProvider
      initial={campaign}
      currentUid={user.uid}
      campaignId={campaign.id}
    >
      <RosterProvider characters={characters}>{children}</RosterProvider>
    </CampaignProvider>
  );
}
