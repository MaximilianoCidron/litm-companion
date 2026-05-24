import { Skeleton } from "@/shared/ui";

export default function SettingsLoading() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6 md:p-8">
      <header className="flex flex-col gap-1">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-48" />
      </header>
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-mist-light bg-parchment-elevated p-4 dark:border-mist-dark dark:bg-ink-elevated"
        >
          <Skeleton className="mb-3 h-3 w-24" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}
