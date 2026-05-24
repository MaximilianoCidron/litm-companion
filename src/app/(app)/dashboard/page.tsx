import Link from "next/link";
import { Card } from "@/shared/ui";
import { getSessionUser } from "@/shared/auth";
import { CharacterGrid, DashboardHeader } from "@/features/character-sheet";
import { IncomingInvitationsSection } from "@/features/character-sheet/components/invite/incoming-invitations-section";
import {
  getMyCampaigns,
  getMyCharacters,
  getUserSettingsServerSide,
} from "@/features/character-sheet/lib/queries";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: Promise<{ archived?: string }>;
}) {
  const user = await getSessionUser();
  const params = (await searchParams) ?? {};
  // URL param takes precedence as a per-session override; absent it, the
  // user's setting governs.
  const settings = await getUserSettingsServerSide(user.uid);
  const includeRetired =
    params.archived === "1"
      ? true
      : params.archived === "0"
        ? false
        : settings.showRetiredCharacters;

  const [characters, campaigns] = await Promise.all([
    getMyCharacters(user.uid, { includeRetired }),
    getMyCampaigns(user.uid),
  ]);
  const firstName =
    user.displayName?.trim().split(/\s+/)[0] ??
    user.email?.split("@")[0] ??
    "friend";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:px-6 lg:px-8">
      <DashboardHeader firstName={firstName} />
      <IncomingInvitationsSection currentUid={user.uid} />
      <div className="flex items-center justify-end">
        <Link
          href={
            includeRetired ? "/dashboard?archived=0" : "/dashboard?archived=1"
          }
          className="text-sm text-ink-muted underline-offset-2 hover:underline dark:text-parchment-muted"
        >
          {includeRetired ? "Hide archived" : "Show archived"}
        </Link>
      </div>
      <CharacterGrid characters={characters} />
      {campaigns.length > 0 ? (
        <section className="flex flex-col gap-4">
          <header className="flex items-baseline justify-between">
            <h2 className="font-display text-2xl text-ink-base dark:text-parchment-base">
              Your fellowships
            </h2>
            <Link
              href="/campaigns"
              className="text-sm font-display uppercase tracking-wider text-ember hover:underline"
            >
              See all →
            </Link>
          </header>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaigns.slice(0, 6).map((c) => (
              <Link key={c.id} href={`/campaigns/${c.id}`}>
                <Card variant="interactive">
                  <Card.Header title={c.name} />
                  <Card.Body>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink-muted dark:text-parchment-muted">
                        {c.rosterCount}{" "}
                        {c.rosterCount === 1 ? "hero" : "heroes"}
                      </span>
                      {c.gmUid === user.uid ? (
                        <span className="font-display text-xs uppercase tracking-wider text-ember">
                          You GM
                        </span>
                      ) : null}
                    </div>
                  </Card.Body>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
