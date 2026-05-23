import { notFound } from "next/navigation";
import { ActionError, getSessionUser } from "@/shared/auth";
import { getCharacterWithCampaign } from "@/features/character-sheet/lib/queries";
import {
  BookTabBarMobile,
  BookTabNav,
  CampaignProvider,
  CharacterProvider,
  ConnectionBanner,
} from "@/features/character-sheet";
import { RollPanel } from "@/features/character-sheet/components/roll-builder";
import { RollResultDialog } from "@/features/character-sheet/components/roll-builder/result-dialog";

export default async function CharacterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ charId: string }>;
}) {
  const { charId } = await params;
  const user = await getSessionUser();

  let initial;
  let role: "owner" | "gm";
  let campaign;
  try {
    const result = await getCharacterWithCampaign(charId, user.uid);
    initial = result.character;
    role = result.role;
    campaign = result.campaign;
  } catch (err) {
    if (err instanceof ActionError && err.code === "NOT_FOUND") {
      notFound();
    }
    throw err;
  }

  return (
    <CharacterProvider initial={initial} role={role}>
      <CampaignProvider initial={campaign} currentUid={user.uid}>
        <div className="flex min-h-full flex-col">
          <ConnectionBanner />
          <BookTabBarMobile charId={charId} />
          <div className="flex flex-1 flex-col md:flex-row">
            <BookTabNav charId={charId} />
            <main className="flex-1 bg-parchment p-6 pb-24 dark:bg-ink md:p-10 md:pb-10">
              {children}
            </main>
          </div>
        </div>
        <RollPanel />
        <RollResultDialog />
      </CampaignProvider>
    </CharacterProvider>
  );
}
