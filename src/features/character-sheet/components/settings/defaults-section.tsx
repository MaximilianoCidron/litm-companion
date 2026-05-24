"use client";
import { updateUserSettings } from "../../actions";
import type { UserSettings } from "../../schemas";
import { SettingRow, Toggle } from "./setting-row";
import { SettingsCard } from "./privacy-section";

export function DefaultsSection({ settings }: { settings: UserSettings }) {
  return (
    <SettingsCard heading="Defaults">
      <SettingRow
        label="Show retired characters by default"
        description="Dashboard includes retired heroes without needing the URL toggle."
        control={
          <Toggle
            checked={settings.showRetiredCharacters}
            ariaLabel="Show retired characters by default"
            onChange={(next) =>
              void updateUserSettings({
                patch: { showRetiredCharacters: next },
              })
            }
          />
        }
      />
      <SettingRow
        label="Confirm before rolling"
        description="Show a summary dialog before committing each roll."
        control={
          <Toggle
            checked={settings.confirmBeforeRolling}
            ariaLabel="Confirm before rolling"
            onChange={(next) =>
              void updateUserSettings({
                patch: { confirmBeforeRolling: next },
              })
            }
          />
        }
      />
    </SettingsCard>
  );
}
