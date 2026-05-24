import { ActionError, getSessionUser } from "@/shared/auth";
import { GmPendingThreatBanner } from "@/features/character-sheet";
import { CampaignPageShell } from "@/features/character-sheet/components/campaign/campaign-page-shell";
import {
  getPendingAllocations,
  type PendingAllocation,
} from "@/features/character-sheet/lib/queries";

export default async function CampaignPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();

  // GM-only fetch. Non-GM viewers get FORBIDDEN — that's expected; swallow
  // so the page still renders without the panel.
  let pendingAllocations: PendingAllocation[] = [];
  try {
    pendingAllocations = await getPendingAllocations(campaignId, user.uid);
  } catch (err) {
    if (!(err instanceof ActionError && err.code === "FORBIDDEN")) {
      throw err;
    }
  }

  return (
    <>
      <div className="px-6 pt-6 md:px-10 md:pt-10">
        <GmPendingThreatBanner />
      </div>
      <CampaignPageShell
        currentUid={user.uid}
        pendingAllocations={pendingAllocations}
      />
    </>
  );
}
