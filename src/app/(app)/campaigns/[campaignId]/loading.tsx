import { Skeleton } from "@/shared/ui";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-10">
      <Skeleton className="h-9 w-72" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
