"use client";
import { getFirebaseAuth } from "@/shared/firebase/client";

/**
 * Force a fresh ID token + re-mint the session cookie so subsequent server
 * requests see updated auth claims (e.g., a new displayName). Returns true
 * on success. Caller typically follows with router.refresh() to re-render
 * Server Components with the new claims.
 */
export async function refreshSession(): Promise<boolean> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return false;
  try {
    const idToken = await user.getIdToken(true);
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    return res.ok;
  } catch (err) {
    console.warn("[refresh-session] failed", err);
    return false;
  }
}
