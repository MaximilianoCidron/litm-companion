"use client";
import Link from "next/link";
import { useTransition } from "react";
import { LogOut, Monitor, Moon, Settings, Sun } from "lucide-react";
import { signOut as firebaseSignOut } from "firebase/auth";
import { getFirebaseAuth } from "@/shared/firebase/client";
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

export type ThemePreference = "light" | "dark" | "system";

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
  themePreference: ThemePreference;
  onSetTheme: (next: ThemePreference) => void;
}

export function UserMenu({
  user,
  signOut,
  themePreference,
  onSetTheme,
}: UserMenuProps) {
  const [pending, startTransition] = useTransition();

  const onSignOut = () => {
    startTransition(async () => {
      // Drop the client SDK session first so onSnapshot listeners stop firing
      // against rules with the about-to-be-revoked token. Server action then
      // revokes refresh tokens + clears the httpOnly cookie + redirects.
      try {
        await firebaseSignOut(getFirebaseAuth());
      } catch {
        // Best-effort; server signOut still runs.
      }
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
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {themePreference === "dark" ? (
              <Moon className="h-4 w-4" aria-hidden="true" />
            ) : themePreference === "light" ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Monitor className="h-4 w-4" aria-hidden="true" />
            )}
            Theme
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={themePreference}
              onValueChange={(v) => onSetTheme(v as ThemePreference)}
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
