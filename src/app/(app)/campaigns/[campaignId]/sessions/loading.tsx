import { Skeleton } from "@/shared/ui";

export default function SessionsLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6 md:p-8">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
