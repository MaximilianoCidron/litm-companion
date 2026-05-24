"use client";
import { updateUserSettings } from "../../actions";
import type { UserSettings } from "../../schemas";
import { SettingRow, Toggle } from "./setting-row";
import { SettingsCard } from "./privacy-section";

export function NotificationsSection({ settings }: { settings: UserSettings }) {
  return (
    <SettingsCard heading="Notifications">
      <SettingRow
        label="Invitation toasts"
        description="Pop a transient toast when a new campaign invitation arrives. The dashboard banner is always visible."
        control={
          <Toggle
            checked={settings.showInvitationToasts}
            ariaLabel="Invitation toasts"
            onChange={(next) =>
              void updateUserSettings({
                patch: { showInvitationToasts: next },
              })
            }
          />
        }
      />
      <SettingRow
        label="Pending threat toasts"
        description="Pop a transient toast when a new pending threat arrives. The in-page banner is always visible."
        control={
          <Toggle
            checked={settings.showPendingThreatToasts}
            ariaLabel="Pending threat toasts"
            onChange={(next) =>
              void updateUserSettings({
                patch: { showPendingThreatToasts: next },
              })
            }
          />
        }
      />
    </SettingsCard>
  );
}
