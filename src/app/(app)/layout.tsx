import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/shared/firebase/session";
import type { AppUser } from "@/shared/components/UserMenu";
import { signOutAction } from "@/features/auth";
import { HeartbeatLoop } from "@/features/character-sheet/components/presence/heartbeat-loop";
import { UserSettingsProvider } from "@/features/character-sheet/components/UserSettingsProvider";
import { ThemeApplier } from "@/features/character-sheet/components/ThemeApplier";
import { AppHeaderContainer } from "@/features/character-sheet/components/AppHeaderContainer";
import { AuthSyncGuard } from "@/features/character-sheet/components/AuthSyncGuard";
import { InboxProvider } from "@/features/character-sheet/components/inbox/inbox-provider";
import { getMyCampaigns } from "@/features/character-sheet/lib/queries";

/**
 * Server-side session guard for the authenticated app shell.
 * Every request to a route under (app)/ is gated here.
 * Server Actions and Route Handlers MUST also re-verify the cookie
 * — this guard is one layer, not the only layer.
 */
export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const claims = await verifySessionCookie();
  if (!claims) {
    redirect("/login");
  }

  const user: AppUser = {
    uid: claims.sub,
    email: claims.email ?? null,
    displayName: (claims.name as string | undefined) ?? null,
    photoURL: (claims.picture as string | undefined) ?? null,
  };

  const campaignSummaries = await getMyCampaigns(user.uid);
  const inboxCampaigns = campaignSummaries.map((c) => ({
    id: c.id,
    gmUid: c.gmUid,
    name: c.name,
  }));

  return (
    <UserSettingsProvider uid={user.uid}>
      <AuthSyncGuard serverUid={user.uid} />
      <ThemeApplier />
      <InboxProvider uid={user.uid} campaigns={inboxCampaigns}>
        <div className="flex min-h-dvh flex-col">
          <HeartbeatLoop />
          <AppHeaderContainer user={user} signOut={signOutAction} />
          <div className="flex-1">{children}</div>
        </div>
      </InboxProvider>
    </UserSettingsProvider>
  );
}
