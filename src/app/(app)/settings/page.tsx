import { getSessionUser } from "@/shared/auth";
import { SettingsView } from "@/features/character-sheet/components/settings/settings-view";

export default async function SettingsPage() {
  const user = await getSessionUser();
  return (
    <SettingsView
      initialUser={{
        uid: user.uid,
        displayName: user.displayName ?? "",
        email: user.email ?? "",
      }}
    />
  );
}
