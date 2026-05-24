"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/shared/firebase/client";
import { firestoreToUserSettings } from "../lib/serialize";
import { defaultSettingsFor, type UserSettings } from "../schemas";

/**
 * Live listener for the caller's userSettings doc. Always returns a
 * UserSettings — defaults to defaultSettingsFor(uid) until the listener
 * resolves or when the doc doesn't exist yet. Consumers never see null.
 *
 * The listener is gated on Firebase Auth client SDK readiness. The provider
 * mounts at the app-shell layer with a server-side uid immediately, but the
 * client SDK hydrates auth state asynchronously from IndexedDB. Attaching
 * onSnapshot before that hydration completes leads to "Missing or
 * insufficient permissions" since the rules check request.auth.uid.
 */
export function useUserSettingsListener(uid: string | null): UserSettings {
  const [settings, setSettings] = useState<UserSettings>(() =>
    defaultSettingsFor(uid ?? "__placeholder__"),
  );
  const [clientAuthReady, setClientAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setClientAuthReady(user !== null && user.uid === uid);
    });
    return unsub;
  }, [uid]);

  useEffect(() => {
    if (!uid || !clientAuthReady) {
      const t = setTimeout(
        () => setSettings(defaultSettingsFor(uid ?? "__placeholder__")),
        0,
      );
      return () => clearTimeout(t);
    }
    const tReset = setTimeout(() => setSettings(defaultSettingsFor(uid)), 0);
    const unsub = onSnapshot(
      doc(getFirebaseDb(), "userSettings", uid),
      (snap) => {
        try {
          const parsed = firestoreToUserSettings({
            id: snap.id,
            data: () => snap.data() ?? undefined,
          });
          setSettings(parsed ?? defaultSettingsFor(uid));
        } catch (err) {
          console.warn("[user-settings] parse failed", err);
          setSettings(defaultSettingsFor(uid));
        }
      },
      (err) => {
        console.warn("[user-settings] listener error", err);
      },
    );
    return () => {
      clearTimeout(tReset);
      unsub();
    };
  }, [uid, clientAuthReady]);

  return settings;
}
