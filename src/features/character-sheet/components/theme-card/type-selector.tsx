"use client";
import { ChevronDown } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui";
import {
  formatThemeType,
  ThemeTypeSchema,
  type ThemeType,
} from "../../schemas";

const ALL_TYPES = ThemeTypeSchema.options;

const GROUPS: Record<"origin" | "adventure" | "greatness", ThemeType[]> = {
  origin: ALL_TYPES.filter((t) => t.startsWith("origin:")),
  adventure: ALL_TYPES.filter((t) => t.startsWith("adventure:")),
  greatness: ALL_TYPES.filter((t) => t.startsWith("greatness:")),
};

interface TypeSelectorProps {
  value: ThemeType;
  onChange: (next: ThemeType) => void;
  disabled?: boolean;
}

export function TypeSelector({ value, onChange, disabled }: TypeSelectorProps) {
  const { label, mightLabel } = formatThemeType(value);

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild disabled={disabled}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="font-display text-parchment-elevated hover:bg-parchment-elevated/10"
            >
              <span>{label}</span>
              <span className="text-xs text-parchment-muted">
                · {mightLabel}
              </span>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>Click to change theme type</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start" sideOffset={8}>
        {(Object.keys(GROUPS) as Array<keyof typeof GROUPS>).map(
          (might, groupIdx) => (
            <div key={might}>
              {groupIdx > 0 ? <DropdownMenuSeparator /> : null}
              <DropdownMenuLabel>
                {might === "origin"
                  ? "Origin"
                  : might === "adventure"
                    ? "Adventure"
                    : "Greatness"}
              </DropdownMenuLabel>
              {GROUPS[might].map((type) => {
                const { label: typeLabel } = formatThemeType(type);
                const isCurrent = type === value;
                return (
                  <DropdownMenuItem
                    key={type}
                    onSelect={() => {
                      if (!isCurrent) onChange(type);
                    }}
                    className={
                      isCurrent
                        ? "bg-parchment-soft dark:bg-ink-soft font-medium"
                        : undefined
                    }
                  >
                    {typeLabel}
                  </DropdownMenuItem>
                );
              })}
            </div>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
