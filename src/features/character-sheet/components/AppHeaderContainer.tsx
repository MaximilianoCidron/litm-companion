"use client";
import { AppHeader } from "@/shared/components/AppHeader";
import type { AppUser, ThemePreference } from "@/shared/components/UserMenu";
import { updateUserSettings } from "../actions";
import { InboxBell } from "./inbox/inbox-bell";
import { useUserSettings } from "./UserSettingsProvider";

interface AppHeaderContainerProps {
  user: AppUser;
  signOut: () => Promise<void>;
}

export function AppHeaderContainer({
  user,
  signOut,
}: AppHeaderContainerProps) {
  const { themePreference } = useUserSettings();
  const onSetTheme = (next: ThemePreference) => {
    void updateUserSettings({ patch: { themePreference: next } });
  };
  return (
    <AppHeader
      user={user}
      signOut={signOut}
      themePreference={themePreference}
      onSetTheme={onSetTheme}
      leftOfMenu={<InboxBell />}
    />
  );
}
