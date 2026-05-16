import "server-only";
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";
import { getAdminAuth } from "./admin";

export const SESSION_COOKIE_NAME = "__session";

export function getSessionCookieMaxAgeSeconds(): number {
  const raw = process.env.SESSION_COOKIE_MAX_AGE_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 60 * 60 * 24 * 5;
}

/**
 * Verify the session cookie attached to the current request.
 * Returns the decoded claims, or null when no/invalid cookie is present.
 * `checkRevoked: true` forces a round-trip to the Auth backend — use it
 * in Server Actions that perform writes (defense-in-depth vs CVE-2025-29927).
 */
export async function verifySessionCookie(
  options: { checkRevoked?: boolean } = {},
): Promise<DecodedIdToken | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!cookie) return null;
  try {
    return await getAdminAuth().verifySessionCookie(
      cookie,
      options.checkRevoked ?? false,
    );
  } catch {
    return null;
  }
}

/**
 * Server Action / Route Handler helper — throws if the caller is not authenticated.
 * Always passes checkRevoked=true so mutation paths catch revoked sessions.
 */
export async function requireUser(): Promise<DecodedIdToken> {
  const claims = await verifySessionCookie({ checkRevoked: true });
  if (!claims) {
    throw new Error("UNAUTHENTICATED");
  }
  return claims;
}
