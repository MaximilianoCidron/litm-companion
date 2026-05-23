import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/shared/firebase/session";
import { AppHeader } from "@/shared/components/AppHeader";
import type { AppUser } from "@/shared/components/UserMenu";
import { signOutAction } from "@/features/auth";
import { HeartbeatLoop } from "@/features/character-sheet/components/presence/heartbeat-loop";

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

  return (
    <div className="flex min-h-dvh flex-col">
      <HeartbeatLoop />
      <AppHeader user={user} signOut={signOutAction} />
      <div className="flex-1">{children}</div>
    </div>
  );
}
