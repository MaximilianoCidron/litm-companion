"use client";

import { Bed, Pencil, Tent } from "lucide-react";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { CampActivity } from "./helpers";

interface ActivityPickerProps {
  value: CampActivity;
  onChange: (next: CampActivity) => void;
}

const OPTIONS: { key: CampActivity; label: string; Icon: typeof Bed }[] = [
  { key: "rest", label: "Rest", Icon: Bed },
  { key: "reflect", label: "Reflect", Icon: Pencil },
  { key: "campAction", label: "Camp action", Icon: Tent },
];

export function ActivityPicker({ value, onChange }: ActivityPickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Choose your camp activity"
      className="flex flex-wrap gap-2"
    >
      {OPTIONS.map(({ key, label, Icon }) => {
        const active = value === key;
        return (
          <Button
            key={key}
            type="button"
            variant={active ? "primary" : "ghost"}
            size="sm"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(key)}
            className={cn(!active && "border border-mist-light dark:border-mist-dark")}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {label}
          </Button>
        );
      })}
    </div>
  );
}
