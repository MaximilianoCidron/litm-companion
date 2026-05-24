"use client";
import { updateUserSettings } from "../../actions";
import type { ThemePreference, UserSettings } from "../../schemas";
import { RadioOptions, SettingRow } from "./setting-row";
import { SettingsCard } from "./privacy-section";

const THEME_OPTIONS: ReadonlyArray<{ value: ThemePreference; label: string }> =
  [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System" },
  ];

export function AppearanceSection({ settings }: { settings: UserSettings }) {
  return (
    <SettingsCard heading="Appearance">
      <SettingRow
        label="Theme"
        description="System matches your device's setting."
        control={
          <RadioOptions<ThemePreference>
            ariaLabel="Theme preference"
            value={settings.themePreference}
            options={THEME_OPTIONS}
            onChange={(next) =>
              void updateUserSettings({ patch: { themePreference: next } })
            }
          />
        }
      />
    </SettingsCard>
  );
}
