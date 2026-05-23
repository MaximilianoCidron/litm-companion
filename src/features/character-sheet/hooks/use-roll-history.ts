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
import { firestoreToRollRecord } from "../lib/serialize";
import type { RollRecord } from "../schemas";

const PAGE_SIZE = 30;

export type RollHistoryState =
  | { status: "loading"; rolls: readonly RollRecord[]; error: null }
  | { status: "live"; rolls: readonly RollRecord[]; error: null }
  | { status: "error"; rolls: readonly RollRecord[]; error: Error };

/**
 * Live listener over the `characters/{id}/rolls` subcollection, newest first,
 * capped at PAGE_SIZE. Malformed records are skipped (logged) so one bad
 * doc cannot break the History view. This hook is the ONLY client-side reader
 * of the rolls subcollection — do not call getDocs ad hoc from components.
 */
export function useRollHistory(characterId: string): RollHistoryState {
  const [state, setState] = useState<RollHistoryState>({
    status: "loading",
    rolls: [],
    error: null,
  });

  useEffect(() => {
    const q = query(
      collection(getFirebaseDb(), "characters", characterId, "rolls"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const rolls: RollRecord[] = [];
        for (const docSnap of snap.docs) {
          try {
            rolls.push(
              firestoreToRollRecord({
                id: docSnap.id,
                data: () => docSnap.data() ?? undefined,
              }),
            );
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn(
              "[roll-history] skipping malformed roll",
              docSnap.id,
              err,
            );
          }
        }
        setState({ status: "live", rolls, error: null });
      },
      (err) => {
        setState((prev) => ({
          status: "error",
          rolls: prev.rolls,
          error: err,
        }));
      },
    );
    return unsubscribe;
  }, [characterId]);

  return state;
}
