import { getSessionUser } from "@/shared/auth";
import { GmPendingThreatBanner } from "@/features/character-sheet";
import { CampaignPageShell } from "@/features/character-sheet/components/campaign/campaign-page-shell";

export default async function CampaignPage() {
  const user = await getSessionUser();
  return (
    <>
      <div className="px-6 pt-6 md:px-10 md:pt-10">
        <GmPendingThreatBanner />
      </div>
      <CampaignPageShell currentUid={user.uid} />
    </>
  );
}
