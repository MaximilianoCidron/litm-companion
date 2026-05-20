import { Skeleton } from "@/shared/ui";

export default function CharacterLoading() {
  return (
    <div className="flex min-h-full flex-col">
      <section className="bg-parchment-soft px-4 py-4 dark:bg-ink-soft md:px-6">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </section>
      <div className="flex flex-1 flex-col md:flex-row">
        <nav
          aria-label="Loading sections"
          className="hidden w-32 shrink-0 flex-col bg-ink-muted md:flex md:w-40"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex h-20 flex-col items-center justify-center gap-1 border-b border-ink-base/20"
            >
              <Skeleton className="h-6 w-6 rounded-full bg-parchment-elevated/20" />
              <Skeleton className="h-3 w-12 bg-parchment-elevated/20" />
            </div>
          ))}
        </nav>
        <main className="flex-1 bg-parchment p-6 dark:bg-ink md:p-10">
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-60 w-full" />
            <Skeleton className="h-60 w-full" />
          </div>
        </main>
      </div>
    </div>
  );
}
