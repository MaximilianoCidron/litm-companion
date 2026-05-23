import { Skeleton } from "@/shared/ui";

export default function SessionLogLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6 md:p-8">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-10 w-full" />
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}
