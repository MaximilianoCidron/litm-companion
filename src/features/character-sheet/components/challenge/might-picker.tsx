"use client";

import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { MightLevelSchema, type MightLevel } from "../../schemas";
import { formatMight } from "./helpers";

interface MightPickerProps {
  value: MightLevel;
  onChange: (next: MightLevel) => void;
  disabled?: boolean;
}

export function MightPicker({ value, onChange, disabled }: MightPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Might level"
      className="flex flex-wrap gap-2"
    >
      {MightLevelSchema.options.map((level) => {
        const active = value === level;
        return (
          <Button
            key={level}
            type="button"
            variant={active ? "primary" : "ghost"}
            size="sm"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(level)}
            className={cn(
              !active && "border border-mist-light dark:border-mist-dark",
            )}
          >
            {formatMight(level)}
          </Button>
        );
      })}
    </div>
  );
}
