"use client";
import { updateUserSettings } from "../../actions";
import type { UserSettings } from "../../schemas";
import { SettingRow, Toggle } from "./setting-row";

export function PrivacySection({ settings }: { settings: UserSettings }) {
  return (
    <SettingsCard heading="Privacy">
      <SettingRow
        label="Hide my presence"
        description="Other party members won't see when you're online or what campaign you're in."
        control={
          <Toggle
            checked={settings.hidePresence}
            ariaLabel="Hide my presence"
            onChange={(next) =>
              void updateUserSettings({ patch: { hidePresence: next } })
            }
          />
        }
      />
    </SettingsCard>
  );
}

export function SettingsCard({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-mist-light bg-parchment-elevated p-4 dark:border-mist-dark dark:bg-ink-elevated">
      <h2 className="mb-2 font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        {heading}
      </h2>
      <div className="divide-y divide-mist-light dark:divide-mist-dark">
        {children}
      </div>
    </section>
  );
}
