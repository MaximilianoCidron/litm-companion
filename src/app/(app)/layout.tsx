import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/shared/firebase/session";

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
  return <>{children}</>;
}
