"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/shared/firebase/client";
import { refreshSession } from "@/shared/auth/refresh-session";

interface AuthSyncGuardProps {
  serverUid: string;
}

const NO_USER_GRACE_MS = 1500;

async function forceSignOutToLogin() {
  try {
    await signOut(getFirebaseAuth());
  } catch {
    // ignore
  }
  try {
    await fetch("/api/auth/session", { method: "DELETE" });
  } catch {
    // ignore
  }
  // Use a hard navigation so any in-flight Firestore listeners on the
  // current page tear down before /login mounts.
  window.location.assign("/login");
}

/**
 * Reconciles drift between the Firebase Auth client SDK and the server
 * session cookie. They MUST agree — Storage rules gate by client SDK auth,
 * Server Actions gate by the cookie, and Firestore listeners attach with
 * the client SDK's ID token. Three drift cases:
 *
 *   1. Client SDK has no user → server cookie says we're signed in.
 *      Wait a short grace window (SDK hydrates from IndexedDB async), then
 *      clear the server cookie and bounce to /login.
 *
 *   2. Client SDK uid differs from the cookie uid (account switch with
 *      stale cookie). Re-mint the cookie from the client's current token
 *      via refreshSession(), then router.refresh.
 *
 *   3. Client SDK has a cached user but its refresh token was revoked
 *      server-side (prior sign-out, password change). getIdToken(true)
 *      throws — sign everything out so the user re-authenticates instead
 *      of looping on permission-denied from listeners.
 */
export function AuthSyncGuard({ serverUid }: AuthSyncGuardProps) {
  const router = useRouter();
  const settledRef = useRef(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    let graceTimer: ReturnType<typeof setTimeout> | null = null;

    const unsub = onAuthStateChanged(auth, async (user) => {
      if (graceTimer) {
        clearTimeout(graceTimer);
        graceTimer = null;
      }

      if (!user) {
        if (!settledRef.current) {
          // First fire on mount: SDK may still be hydrating from IndexedDB.
          // Give it a grace window before treating null as a real sign-out.
          graceTimer = setTimeout(() => {
            settledRef.current = true;
            if (auth.currentUser === null) {
              void forceSignOutToLogin();
            }
          }, NO_USER_GRACE_MS);
          return;
        }
        // Already settled at least once; null now means an actual sign-out.
        await forceSignOutToLogin();
        return;
      }

      settledRef.current = true;

      // Validate the cached user's token isn't revoked. getIdToken(true)
      // forces a refresh against the Auth backend; a revoked refresh token
      // throws auth/user-token-expired or auth/user-token-revoked.
      try {
        await user.getIdToken(true);
      } catch (err) {
        console.warn("[auth-sync] token refresh failed", err);
        await forceSignOutToLogin();
        return;
      }

      if (user.uid === serverUid) return;

      // uid drift — re-mint the cookie from the live token.
      const ok = await refreshSession();
      if (ok) {
        router.refresh();
      } else {
        await forceSignOutToLogin();
      }
    });

    return () => {
      if (graceTimer) clearTimeout(graceTimer);
      unsub();
    };
  }, [serverUid, router]);

  return null;
}
