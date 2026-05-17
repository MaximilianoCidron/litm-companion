import * as React from "react";
import { EyeOff } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface GMBlockProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
}

export function GMBlock({
  className,
  children,
  label = "GM",
  ...props
}: GMBlockProps) {
  return (
    <div
      className={cn(
        "relative rounded-lg border-l-4 border-[var(--color-gm-veil)] bg-parchment-soft pl-4 pr-4 py-4 dark:bg-ink-soft",
        className,
      )}
      {...props}
    >
      <span
        className={cn(
          "absolute right-2 top-2 inline-flex items-center gap-1 rounded px-2 py-0.5",
          "font-display text-xs uppercase tracking-wider text-[var(--color-gm-veil)]",
        )}
        aria-label="GM only"
      >
        <EyeOff className="h-3 w-3" aria-hidden="true" />
        {label}
      </span>
      {children}
    </div>
  );
}
