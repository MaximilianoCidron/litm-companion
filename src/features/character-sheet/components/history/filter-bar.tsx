"use client";

import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

export type RollFilter = "all" | "success" | "mixed" | "failure" | "reactions";

export type RollFilterCounts = Record<RollFilter, number>;

interface FilterBarProps {
  value: RollFilter;
  onChange: (next: RollFilter) => void;
  counts: RollFilterCounts;
}

const OPTIONS: { key: RollFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "success", label: "Success" },
  { key: "mixed", label: "Mixed" },
  { key: "failure", label: "Failure" },
  { key: "reactions", label: "Reactions" },
];

export function FilterBar({ value, onChange, counts }: FilterBarProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label="Filter rolls"
    >
      {OPTIONS.map((opt) => {
        const isActive = value === opt.key;
        const count = counts[opt.key];
        const disabled = count === 0 && opt.key !== "all";
        return (
          <Button
            key={opt.key}
            type="button"
            variant={isActive ? "primary" : "ghost"}
            size="sm"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(opt.key)}
            disabled={disabled}
          >
            {opt.label}
            <span
              className={cn(
                "numeric ml-1.5 text-xs",
                isActive
                  ? "opacity-80"
                  : "text-ink-subtle dark:text-parchment-subtle",
              )}
            >
              {count}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
