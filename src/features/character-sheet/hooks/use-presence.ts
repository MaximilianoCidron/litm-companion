"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/shared/firebase/client";
import { firestoreToPresence } from "../lib/serialize";
import type { PresenceDoc } from "../schemas";

const ONLINE_THRESHOLD_MS = 60_000;
const REFRESH_TICK_MS = 15_000;

export interface PresenceSummary {
  doc: PresenceDoc | null;
  isOnline: boolean;
}

const OFFLINE: PresenceSummary = { doc: null, isOnline: false };

/**
 * Subscribe to presence docs for a list of uids. Returns a Map keyed by uid.
 * `isOnline` is computed against a `now` value stored in state — the 15s tick
 * effect updates it so the offline transition appears within ~75s of the
 * last heartbeat (60s threshold + tick).
 */
export function usePresence(
  uids: readonly string[],
): Map<string, PresenceSummary> {
  const [docs, setDocs] = useState<Map<string, PresenceDoc | null>>(new Map());
  const [now, setNow] = useState<number>(() => Date.now());
  const stableKey = [...uids].sort().join(",");

  useEffect(() => {
    if (uids.length === 0) {
      const t = setTimeout(() => setDocs(new Map()), 0);
      return () => clearTimeout(t);
    }
    const db = getFirebaseDb();
    const unsubs = uids.map((uid) =>
      onSnapshot(
        doc(db, "presence", uid),
        (snap) => {
          setDocs((prev) => {
            const next = new Map(prev);
            try {
              next.set(
                uid,
                firestoreToPresence({
                  id: snap.id,
                  data: () => snap.data() ?? undefined,
                }),
              );
            } catch (err) {
              console.warn("[presence] parse failed for", uid, err);
              next.set(uid, null);
            }
            return next;
          });
        },
        (err) => {
          console.warn("[presence] listener error for", uid, err);
        },
      ),
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- stableKey covers uids identity
  }, [stableKey]);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), REFRESH_TICK_MS);
    return () => clearInterval(tick);
  }, []);

  const result = new Map<string, PresenceSummary>();
  for (const uid of uids) {
    const presence = docs.get(uid) ?? null;
    const isOnline =
      presence !== null &&
      now - new Date(presence.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
    result.set(uid, { doc: presence, isOnline });
  }
  return result;
}

export function usePresenceOne(
  uid: string | null | undefined,
): PresenceSummary {
  const map = usePresence(uid ? [uid] : []);
  if (!uid) return OFFLINE;
  return map.get(uid) ?? OFFLINE;
}
