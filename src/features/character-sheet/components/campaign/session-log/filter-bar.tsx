"use client";

import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { LogFilter, LogFilterCounts } from "./helpers";

interface FilterBarProps {
  value: LogFilter;
  onChange: (next: LogFilter) => void;
  counts: LogFilterCounts;
}

const OPTIONS: { key: LogFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "annotation", label: "Annotations" },
  { key: "campAction", label: "Camp" },
  { key: "deliverThreat", label: "Threats" },
  { key: "themeAdvancement", label: "Advancements" },
  { key: "momentOfFulfillment", label: "Moments" },
  { key: "sessionBoundary", label: "Sessions" },
  { key: "limitAdvancement", label: "Limit progress" },
];

export function FilterBar({ value, onChange, counts }: FilterBarProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      role="radiogroup"
      aria-label="Filter session log"
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
