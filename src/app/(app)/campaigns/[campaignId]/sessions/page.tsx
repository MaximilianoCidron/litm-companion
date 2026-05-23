import { notFound } from "next/navigation";
import { ActionError, getSessionUser } from "@/shared/auth";
import { listSessions } from "@/features/character-sheet/lib/queries";
import { SessionListView } from "@/features/character-sheet/components/campaign/sessions/list-view";
import { CampaignId } from "@/features/character-sheet/schemas";

export default async function SessionsListPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const user = await getSessionUser();
  try {
    const sessions = await listSessions(campaignId, user.uid);
    return (
      <SessionListView
        campaignId={CampaignId.parse(campaignId)}
        sessions={sessions}
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
