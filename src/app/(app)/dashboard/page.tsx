import { verifySessionCookie } from "@/shared/firebase/session";
import { logoutAction } from "@/features/auth";
import { Button } from "@/shared/ui/button";

export default async function DashboardPage() {
  // Layout already guarded; re-verifying here is cheap and removes the
  // assumption that a parent ran. Mutations elsewhere must do the same.
  const claims = await verifySessionCookie();
  const displayName = claims?.name ?? claims?.email ?? "traveller";

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 md:px-6 lg:px-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Welcome, {displayName}
        </h1>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm">
            Sign out
          </Button>
        </form>
      </header>

      <section className="rounded-xl border border-mist-light bg-parchment-elevated p-6 dark:border-mist-dark dark:bg-ink-elevated">
        <p className="prose text-base">
          Bootstrap scaffold ready. Character sheet, themes, and session view
          arrive in the next pass. Be ready!
        </p>
      </section>
    </main>
  );
}
