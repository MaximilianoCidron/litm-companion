"use client";

import { ChevronDown } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui";
import {
  CHALLENGE_ROLE_DESCRIPTIONS,
  ChallengeRoleSchema,
  type ChallengeRole,
} from "../../schemas";
import { formatRole } from "./helpers";

interface RolePickerProps {
  value: ChallengeRole;
  onChange: (next: ChallengeRole) => void;
  disabled?: boolean;
}

export function RolePicker({ value, onChange, disabled }: RolePickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          aria-label={`Role: ${formatRole(value)}`}
        >
          {formatRole(value)}
          <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-w-xs">
        {ChallengeRoleSchema.options.map((role) => (
          <DropdownMenuItem
            key={role}
            onSelect={() => onChange(role)}
            className="flex flex-col items-start gap-0.5"
          >
            <span className="font-display text-sm">{formatRole(role)}</span>
            <span className="text-xs text-ink-subtle dark:text-parchment-subtle">
              {CHALLENGE_ROLE_DESCRIPTIONS[role]}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
