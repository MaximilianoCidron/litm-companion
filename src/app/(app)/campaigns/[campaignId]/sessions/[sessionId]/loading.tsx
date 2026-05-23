import { Skeleton } from "@/shared/ui";

export default function SessionDetailLoading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-6 md:p-8">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-8 w-72" />
      <Skeleton className="h-4 w-56" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-60 w-full" />
    </div>
  );
}
