import Link from "next/link";
import { Card } from "@/shared/ui";
import { getSessionUser } from "@/shared/auth";
import { getMyCampaigns } from "@/features/character-sheet/lib/queries";

export default async function CampaignsListPage() {
  const user = await getSessionUser();
  const campaigns = await getMyCampaigns(user.uid);

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
      <header>
        <h1 className="font-display text-3xl text-ink-base dark:text-parchment-base">
          Your fellowships
        </h1>
      </header>
      {campaigns.length === 0 ? (
        <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
          You haven&apos;t joined a fellowship yet. Create one from any
          character&apos;s Hero tab.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((c) => (
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
      )}
    </main>
  );
}
