"use client";

import { useEffect, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { getFirebaseDb } from "@/shared/firebase/client";
import { firestoreToSessionLogEntry } from "../lib/serialize";
import type { SessionLogEntry } from "../schemas";

// TODO: pagination — currently capped at 100 entries.
const PAGE_SIZE = 100;

export type SessionLogState =
  | { status: "loading"; entries: readonly SessionLogEntry[]; error: null }
  | { status: "live"; entries: readonly SessionLogEntry[]; error: null }
  | { status: "error"; entries: readonly SessionLogEntry[]; error: Error };

/**
 * Live listener over `campaigns/{cid}/sessionLog`, newest first, capped at
 * PAGE_SIZE. Malformed entries are skipped (logged) — one bad doc can't
 * break the timeline. Single client-side reader of the subcollection.
 */
export function useSessionLog(campaignId: string): SessionLogState {
  const [state, setState] = useState<SessionLogState>({
    status: "loading",
    entries: [],
    error: null,
  });

  useEffect(() => {
    const q = query(
      collection(
        getFirebaseDb(),
        "campaigns",
        campaignId,
        "sessionLog",
      ),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const entries: SessionLogEntry[] = [];
        for (const doc of snap.docs) {
          try {
            entries.push(
              firestoreToSessionLogEntry({
                id: doc.id,
                data: () => doc.data() ?? undefined,
              }),
            );
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn(
              "[session-log] skipping malformed entry",
              doc.id,
              err,
            );
          }
        }
        setState({ status: "live", entries, error: null });
      },
      (err) =>
        setState((prev) => ({
          status: "error",
          entries: prev.entries,
          error: err,
        })),
    );
    return unsubscribe;
  }, [campaignId]);

  return state;
}
