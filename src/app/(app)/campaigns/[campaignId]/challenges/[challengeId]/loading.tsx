import { Skeleton } from "@/shared/ui";

export default function ChallengeLoading() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6 md:p-10">
      <Skeleton className="h-9 w-72" />
      <Skeleton className="h-6 w-96" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
