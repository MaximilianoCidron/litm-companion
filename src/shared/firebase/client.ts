import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

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

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

export function getFirebaseDb(): Firestore {
  return getFirestore(getFirebaseApp());
}
