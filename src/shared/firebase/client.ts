import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const requiredEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function assertConfig(
  cfg: typeof requiredEnv,
): asserts cfg is Record<keyof typeof requiredEnv, string> {
  for (const [k, v] of Object.entries(cfg)) {
    if (!v) {
      throw new Error(
        `Missing Firebase client env var: NEXT_PUBLIC_FIREBASE_${k
          .replace(/[A-Z]/g, (m) => `_${m}`)
          .toUpperCase()}`,
      );
    }
  }
}

let cachedApp: FirebaseApp | undefined;
let cachedAppCheck: AppCheck | undefined;

function getFirebaseApp(): FirebaseApp {
  if (cachedApp) return cachedApp;
  const existing = getApps()[0];
  if (existing) {
    cachedApp = existing;
    return existing;
  }
  assertConfig(requiredEnv);
  cachedApp = initializeApp(requiredEnv);
  return cachedApp;
}

/**
 * Initialize Firebase App Check with reCAPTCHA v3. Browser-only (no-op on the
 * server). Idempotent — subsequent calls return the cached instance. Requires
 * `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`; logs a warning + skips when missing so
 * dev environments without App Check still boot.
 */
export function getFirebaseAppCheck(): AppCheck | null {
  if (typeof window === "undefined") return null;
  if (cachedAppCheck) return cachedAppCheck;
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    console.warn(
      "[app-check] NEXT_PUBLIC_RECAPTCHA_SITE_KEY missing — skipping App Check init.",
    );
    return null;
  }
  cachedAppCheck = initializeAppCheck(getFirebaseApp(), {
    provider: new ReCaptchaV3Provider(siteKey),
    isTokenAutoRefreshEnabled: true,
  });
  return cachedAppCheck;
}

/**
 * Eagerly boot App Check on the browser before any Auth/Firestore/Storage
 * helper hands out a client. Idempotent; no-op on the server.
 */
function ensureAppCheckBooted(): void {
  if (typeof window === "undefined") return;
  if (cachedAppCheck) return;
  getFirebaseAppCheck();
}

export function getFirebaseAuth(): Auth {
  const app = getFirebaseApp();
  ensureAppCheckBooted();
  return getAuth(app);
}

export function getFirebaseDb(): Firestore {
  const app = getFirebaseApp();
  ensureAppCheckBooted();
  return getFirestore(app);
}

export function getFirebaseStorage(): FirebaseStorage {
  const app = getFirebaseApp();
  ensureAppCheckBooted();
  return getStorage(app);
}
