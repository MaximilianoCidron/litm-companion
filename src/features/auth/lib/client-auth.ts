"use client";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseAuth } from "@/shared/firebase/client";

/**
 * Exchange a Firebase ID token for an httpOnly session cookie set by the server.
 * The session cookie is the source of truth for Server Actions; the Firebase
 * client SDK session is kept alive so client-side `onSnapshot` listeners can
 * authenticate against Firestore Security Rules (rules see `request.auth`,
 * which is only populated by the client SDK — the cookie is server-only).
 */
async function exchangeIdTokenForSessionCookie(
  credential: UserCredential,
): Promise<void> {
  const idToken = await credential.user.getIdToken(true);
  const res = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "Login failed" }));
    throw new Error(body.error ?? "Login failed");
  }
  // Keep the client SDK signed in so client listeners (`onSnapshot`) can read
  // per Firestore Security Rules. The httpOnly cookie still gates Server Actions.
  // `getFirebaseAuth()` reference retained for code-level intent.
  void getFirebaseAuth();
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<void> {
  const credential = await signInWithEmailAndPassword(
    getFirebaseAuth(),
    email,
    password,
  );
  await exchangeIdTokenForSessionCookie(credential);
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(getFirebaseAuth(), provider);
  await exchangeIdTokenForSessionCookie(credential);
}
