"use client";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import {
  useMightModifier,
  useRollBuilder,
} from "../../stores/roll-builder";
import type { MightModifier } from "../../schemas";

const OPTIONS: { value: MightModifier; label: string }[] = [
  { value: -6, label: "−6 Outmatched" },
  { value: -3, label: "−3 Imperiled" },
  { value: 0, label: "Even" },
  { value: 3, label: "+3 Favored" },
  { value: 6, label: "+6 Overwhelming" },
];

export function MightSelector() {
  const current = useMightModifier();
  const setMight = useRollBuilder((s) => s.setMight);

  return (
    <div
      className="flex flex-col gap-2 px-4 py-3"
      role="group"
      aria-label="Might modifier"
    >
      <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
        Might
      </span>
      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-1">
        {OPTIONS.map((opt) => {
          const active = current === opt.value;
          return (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={active ? "primary" : "ghost"}
              onClick={() => setMight(opt.value)}
              className={cn("justify-start font-display tracking-wide")}
            >
              <span className="numeric mr-1">
                {opt.value > 0 ? `+${opt.value}` : opt.value === 0 ? "0" : opt.value}
              </span>
              <span className="text-xs uppercase">
                {opt.label.split(" ").slice(1).join(" ") || "Even"}
              </span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
