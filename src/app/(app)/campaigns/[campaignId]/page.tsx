import { getSessionUser } from "@/shared/auth";
import { CampaignPageShell } from "@/features/character-sheet/components/campaign/campaign-page-shell";

export default async function CampaignPage() {
  const user = await getSessionUser();
  return <CampaignPageShell currentUid={user.uid} />;
}
