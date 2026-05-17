import * as React from "react";
import { cn } from "@/shared/lib/cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="presentation"
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded bg-parchment-soft dark:bg-ink-soft",
        className,
      )}
      {...props}
    />
  );
}
