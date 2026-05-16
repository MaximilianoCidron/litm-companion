import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdminAuth } from "@/shared/firebase/admin";
import {
  SESSION_COOKIE_NAME,
  getSessionCookieMaxAgeSeconds,
  verifySessionCookie,
} from "@/shared/firebase/session";
import { sessionRequestSchema } from "@/features/auth";

/**
 * Exchange a Firebase ID token for an httpOnly session cookie.
 * The client is expected to call this immediately after a successful
 * signInWith* call, then drop its in-memory token.
 */
export async function POST(req: Request): Promise<NextResponse> {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = sessionRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 },
    );
  }

  const maxAgeSeconds = getSessionCookieMaxAgeSeconds();
  let sessionCookie: string;
  try {
    sessionCookie = await getAdminAuth().createSessionCookie(parsed.data.idToken, {
      expiresIn: maxAgeSeconds * 1000,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not establish a session." },
      { status: 401 },
    );
  }

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });

  return NextResponse.json({ ok: true });
}

/**
 * Clear the session cookie and revoke refresh tokens for the calling user.
 * Used by the client-side logout helper; the Server Action equivalent lives
 * in features/auth/actions/logout.ts.
 */
export async function DELETE(): Promise<NextResponse> {
  const claims = await verifySessionCookie({ checkRevoked: false });
  if (claims) {
    try {
      await getAdminAuth().revokeRefreshTokens(claims.sub);
    } catch {
      // ignore — cookie clear below is the user-facing guarantee
    }
  }
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
  return NextResponse.json({ ok: true });
}
