import { notFound } from "next/navigation";
import { ActionError, getSessionUser } from "@/shared/auth";
import { getSessionDetail } from "@/features/character-sheet/lib/queries";
import { SessionDetailView } from "@/features/character-sheet/components/campaign/sessions/detail-view";
import { CampaignId } from "@/features/character-sheet/schemas";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; sessionId: string }>;
}) {
  const { campaignId, sessionId } = await params;
  const user = await getSessionUser();
  try {
    const detail = await getSessionDetail(campaignId, sessionId, user.uid);
    return (
      <SessionDetailView
        campaignId={CampaignId.parse(campaignId)}
        currentUid={user.uid}
        detail={detail}
      />
    );
  } catch (err) {
    if (
      err instanceof ActionError &&
      (err.code === "NOT_FOUND" || err.code === "FORBIDDEN")
    ) {
      notFound();
    }
    throw err;
  }
}
