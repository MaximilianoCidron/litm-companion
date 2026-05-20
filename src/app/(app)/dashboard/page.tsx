import { getSessionUser } from "@/shared/auth";
import { CharacterGrid, DashboardHeader } from "@/features/character-sheet";
import { getMyCharacters } from "@/features/character-sheet/lib/queries";

export default async function DashboardPage() {
  const user = await getSessionUser();
  const characters = await getMyCharacters(user.uid);
  const firstName =
    user.displayName?.trim().split(/\s+/)[0] ??
    user.email?.split("@")[0] ??
    "friend";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
      <DashboardHeader firstName={firstName} />
      <CharacterGrid characters={characters} />
    </main>
  );
}
