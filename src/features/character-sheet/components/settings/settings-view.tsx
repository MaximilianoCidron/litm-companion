"use client";
import { useUserSettings } from "../UserSettingsProvider";
import { AccountSection } from "./account-section";
import { AppearanceSection } from "./appearance-section";
import { DefaultsSection } from "./defaults-section";
import { NotificationsSection } from "./notifications-section";
import { PrivacySection } from "./privacy-section";
import { StorageSection } from "./storage-section";

interface SettingsViewProps {
  initialUser: {
    uid: string;
    displayName: string;
    email: string;
  };
}

export function SettingsView({ initialUser }: SettingsViewProps) {
  const settings = useUserSettings();
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6 md:p-8">
      <header>
        <h1 className="font-display text-2xl text-ink-base dark:text-parchment-base">
          Settings
        </h1>
        <p className="text-sm text-ink-muted dark:text-parchment-muted">
          Changes save automatically.
        </p>
      </header>

      <AccountSection
        currentDisplayName={initialUser.displayName}
        currentEmail={initialUser.email}
      />
      <PrivacySection settings={settings} />
      <AppearanceSection settings={settings} />
      <DefaultsSection settings={settings} />
      <NotificationsSection settings={settings} />
      <StorageSection />
    </div>
  );
}
