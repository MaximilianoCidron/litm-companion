import "server-only";
import { verifySessionCookie } from "@/shared/firebase/session";
import { ActionError } from "./errors";

export interface AuthContext {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

/**
 * Verify the session cookie with checkRevoked = true (mandatory for mutation paths).
 * Defense-in-depth vs CVE-2025-29927. Throws ActionError on failure.
 */
export async function requireAuth(): Promise<AuthContext> {
  const claims = await verifySessionCookie({ checkRevoked: true });
  if (!claims) {
    throw new ActionError("UNAUTHENTICATED", "Sign in required.");
  }
  return {
    uid: claims.sub,
    email: claims.email ?? null,
    displayName: (claims.name as string | undefined) ?? null,
    photoURL: (claims.picture as string | undefined) ?? null,
  };
}
