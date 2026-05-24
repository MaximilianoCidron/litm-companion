"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { refreshSession } from "@/shared/auth/refresh-session";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { updateDisplayName } from "../../actions";
import { SettingsCard } from "./privacy-section";
import { SettingRow } from "./setting-row";

interface AccountSectionProps {
  currentDisplayName: string;
  currentEmail: string;
}

export function AccountSection({
  currentDisplayName,
  currentEmail,
}: AccountSectionProps) {
  const [value, setValue] = useState(currentDisplayName);
  const [saving, setSaving] = useState(false);
  const callAction = useActionWithToast();
  const router = useRouter();

  // Resync local state when the server-side value changes from elsewhere
  // (another tab updated, router.refresh re-flowed the prop, etc.). Defer
  // the setState past the effect body so the react-hooks/set-state-in-effect
  // lint rule passes — same pattern used by use-engaged-challenges.
  useEffect(() => {
    const t = setTimeout(() => setValue(currentDisplayName), 0);
    return () => clearTimeout(t);
  }, [currentDisplayName]);

  const trimmed = value.trim();
  const isDirty = trimmed !== currentDisplayName && trimmed.length > 0;
  const isValid =
    trimmed.length >= 1 && trimmed.length <= 50 && !/[\n\r]/.test(trimmed);

  const handleSave = async () => {
    if (!isDirty || !isValid || saving) return;
    setSaving(true);
    const result = await callAction(
      updateDisplayName({ displayName: trimmed }),
      { onSuccess: "Display name updated" },
    );
    if (result) {
      const refreshed = await refreshSession();
      if (refreshed) {
        router.refresh();
      } else {
        console.warn(
          "[account-section] session refresh failed; reload to apply",
        );
      }
    }
    setSaving(false);
  };

  return (
    <SettingsCard heading="Account">
      <SettingRow
        label="Display name"
        description="Shown in invitations, session log, and presence indicators."
        control={
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              maxLength={50}
              disabled={saving}
              aria-label="Display name"
              className={cn(
                "h-9 w-48 rounded border bg-parchment-elevated px-2 text-sm text-ink-base",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                "dark:bg-ink-elevated dark:text-parchment-base",
                isDirty && !isValid
                  ? "border-crimson"
                  : "border-mist-light dark:border-mist-dark",
              )}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!isDirty || !isValid || saving}
              onClick={handleSave}
            >
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      />
      <SettingRow
        label="Email"
        description="Your sign-in email. Used by GMs when inviting you directly."
        control={
          <span className="text-sm text-ink-muted dark:text-parchment-muted">
            {currentEmail || "—"}
          </span>
        }
      />
    </SettingsCard>
  );
}
