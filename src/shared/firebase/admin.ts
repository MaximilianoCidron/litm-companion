import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

function loadServiceAccount() {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
  if (!projectId || !clientEmail || !rawKey) {
    throw new Error(
      "Firebase Admin env vars missing: set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }
  return {
    projectId,
    clientEmail,
    privateKey: rawKey.replace(/\\n/g, "\n"),
  };
}

let cachedApp: App | undefined;

function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps()[0];
  if (existing) {
    cachedApp = existing;
    return existing;
  }
  const service = loadServiceAccount();
  // Align with the client bucket. Modern Firebase projects use the
  // `.firebasestorage.app` bucket, not the legacy `.appspot.com`; falling back
  // to the latter makes Admin Storage hit a non-existent bucket (404). Reuse
  // the same NEXT_PUBLIC bucket the client SDK uses (readable server-side).
  const storageBucket =
    process.env.FIREBASE_ADMIN_STORAGE_BUCKET ??
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    `${service.projectId}.firebasestorage.app`;
  cachedApp = initializeApp({
    credential: cert(service),
    storageBucket,
  });
  return cachedApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}
