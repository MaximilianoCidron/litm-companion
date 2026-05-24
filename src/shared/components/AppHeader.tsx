"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { UserMenu, type AppUser, type ThemePreference } from "./UserMenu";

interface BreadcrumbProps {
  characterName?: string;
}

function Breadcrumb({ characterName }: BreadcrumbProps) {
  if (!characterName) return null;
  return (
    <div className="hidden items-center gap-2 text-sm text-parchment-muted md:flex">
      <Link
        href="/dashboard"
        className="hover:text-parchment-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember"
      >
        Dashboard
      </Link>
      <ChevronRight className="h-4 w-4" aria-hidden="true" />
      <span className="text-parchment-elevated">{characterName}</span>
    </div>
  );
}

interface AppHeaderProps {
  user: AppUser;
  signOut: () => Promise<void>;
  characterName?: string;
  themePreference: ThemePreference;
  onSetTheme: (next: ThemePreference) => void;
}

export function AppHeader({
  user,
  signOut,
  characterName,
  themePreference,
  onSetTheme,
}: AppHeaderProps) {
  const pathname = usePathname();
  const inCharacterRoute = /^\/characters\/[^/]+/.test(pathname ?? "");

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-ink-muted px-4 text-parchment-elevated md:h-16 md:px-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="font-display text-xl tracking-tight hover:text-parchment-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember"
        >
          Codex
        </Link>
        {inCharacterRoute ? <Breadcrumb characterName={characterName} /> : null}
      </div>
      <UserMenu
        user={user}
        signOut={signOut}
        themePreference={themePreference}
        onSetTheme={onSetTheme}
      />
    </header>
  );
}
