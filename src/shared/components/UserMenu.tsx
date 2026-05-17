"use client";
import { useTransition } from "react";
import { LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui";
import { useSetTheme, useTheme } from "@/shared/stores/ui-store";
import type { Theme } from "@/shared/lib/theme";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

function initials(user: AppUser): string {
  const name = user.displayName ?? user.email ?? "";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

interface UserMenuProps {
  user: AppUser;
  signOut: () => Promise<void>;
}

export function UserMenu({ user, signOut }: UserMenuProps) {
  const theme = useTheme();
  const setTheme = useSetTheme();
  const [pending, startTransition] = useTransition();

  const onSignOut = () => {
    startTransition(async () => {
      await signOut();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-ink-muted"
        aria-label="Open user menu"
      >
        <Avatar size="md">
          {user.photoURL ? (
            <AvatarImage
              src={user.photoURL}
              alt={user.displayName ?? user.email ?? "Account avatar"}
            />
          ) : null}
          <AvatarFallback>{initials(user)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8}>
        <DropdownMenuLabel>
          {user.displayName ?? user.email ?? "Account"}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Settings className="h-4 w-4" aria-hidden="true" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === "dark" ? (
              <Moon className="h-4 w-4" aria-hidden="true" />
            ) : theme === "light" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Monitor className="h-4 w-4" aria-hidden="true" />
            )}
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={theme}
              onValueChange={(v) => setTheme(v as Theme)}
            >
              <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onSelect={onSignOut}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          {pending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
