import { notFound } from "next/navigation";
import { ActionError, getSessionUser } from "@/shared/auth";
import { getChallenge } from "@/features/character-sheet/lib/queries";
import { ChallengeProvider } from "@/features/character-sheet/components/challenge-provider";

export default async function ChallengeLayout({
  params,
  children,
}: {
  params: Promise<{ campaignId: string; challengeId: string }>;
  children: React.ReactNode;
}) {
  const { campaignId, challengeId } = await params;
  const user = await getSessionUser();

  let challenge;
  try {
    challenge = await getChallenge(campaignId, challengeId, user.uid);
  } catch (err) {
    if (
      err instanceof ActionError &&
      (err.code === "NOT_FOUND" || err.code === "FORBIDDEN")
    ) {
      notFound();
    }
    throw err;
  }

  return <ChallengeProvider initial={challenge}>{children}</ChallengeProvider>;
}
