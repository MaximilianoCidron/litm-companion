"use client";
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type UserCredential,
} from "firebase/auth";
import { getFirebaseAuth } from "@/shared/firebase/client";

/**
 * Exchange a Firebase ID token for an httpOnly session cookie set by the server.
 * On success the browser holds no token; subsequent requests rely on the cookie.
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
  // Drop the Firebase client-side session — the cookie is now the source of truth.
  await signOut(getFirebaseAuth());
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
