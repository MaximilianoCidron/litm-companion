import { verifySessionCookie } from "@/shared/firebase/session";
import {
  CharacterGrid,
  DashboardHeader,
  getMyCharactersStub,
} from "@/features/character-sheet";

export default async function DashboardPage() {
  const claims = await verifySessionCookie();
  const displayName = (claims?.name as string | undefined) ?? claims?.email ?? "traveller";
  const firstName = displayName.split(/\s+/)[0] ?? "traveller";

  // TODO: replace with Admin SDK Firestore query.
  const characters = await getMyCharactersStub(claims?.sub ?? "");

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
      <DashboardHeader firstName={firstName} />
      <CharacterGrid characters={characters} />
    </main>
  );
}
