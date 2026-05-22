import { notFound } from "next/navigation";
import { ActionError, getSessionUser } from "@/shared/auth";
import {
  getInvitation,
  getMyCharacters,
} from "@/features/character-sheet/lib/queries";
import { RedeemInvitationView } from "@/features/character-sheet/components/invite/redeem-invitation-view";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getSessionUser();

  let invitation;
  try {
    invitation = await getInvitation(token);
  } catch (err) {
    if (err instanceof ActionError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  const characters = await getMyCharacters(user.uid);
  return (
    <RedeemInvitationView invitation={invitation} characters={characters} />
  );
}
