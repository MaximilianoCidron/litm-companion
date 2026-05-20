"use client";
import { Button, toast } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";

export type AdvancementKind = "improve" | "milestone" | "abandon";

const LABEL: Record<AdvancementKind, string> = {
  improve: "Claim improvement",
  milestone: "Evolve theme",
  abandon: "Replace theme",
};

interface AdvancementBadgeProps {
  kind: AdvancementKind;
  themeId: string;
  disabled?: boolean;
  /** When true, apply a one-shot celebratory glow (respects prefers-reduced-motion). */
  celebrate?: boolean;
}

// TODO(advancement-flow): wire to claimImprovement / evolveTheme / replaceTheme
// when those actions land.
export function AdvancementBadge({
  kind,
  themeId,
  disabled = false,
  celebrate = false,
}: AdvancementBadgeProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={disabled}
      onClick={() => {
        toast.show({
          title: "Coming soon",
          description:
            "Mark this with the Narrator and we'll wire the flow next.",
        });
        void themeId;
      }}
      className={cn(
        "ring-1 ring-ember/30",
        celebrate && "fx-celebrate",
      )}
    >
      {LABEL[kind]}
    </Button>
  );
}
