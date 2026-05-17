"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminAuth } from "@/shared/firebase/admin";
import {
  SESSION_COOKIE_NAME,
  verifySessionCookie,
} from "@/shared/firebase/session";

/**
 * Server Action — sign out the current user.
 * Re-verifies the session cookie (defense-in-depth vs CVE-2025-29927)
 * and revokes refresh tokens so a stolen cookie cannot be reused.
 */
export async function signOutAction(): Promise<void> {
  const claims = await verifySessionCookie({ checkRevoked: true });
  if (claims) {
    try {
      await getAdminAuth().revokeRefreshTokens(claims.sub);
    } catch {
      // Best-effort; clearing the cookie below is the user-facing guarantee.
    }
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}
