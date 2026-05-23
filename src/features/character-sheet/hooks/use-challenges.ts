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
import { firestoreToChallenge } from "../lib/serialize";
import type { Challenge } from "../schemas";

const PAGE_SIZE = 50;

export type ChallengesState =
  | { status: "loading"; challenges: readonly Challenge[]; error: null }
  | { status: "live"; challenges: readonly Challenge[]; error: null }
  | { status: "error"; challenges: readonly Challenge[]; error: Error };

/**
 * Live list of GM-owned challenges for a campaign. Firestore Security Rules
 * gate read access to the GM only; non-GM clients will see a permission error.
 * Malformed challenge docs are skipped (logged) to keep the list resilient.
 */
export function useChallenges(campaignId: string): ChallengesState {
  const [state, setState] = useState<ChallengesState>({
    status: "loading",
    challenges: [],
    error: null,
  });

  useEffect(() => {
    const q = query(
      collection(
        getFirebaseDb(),
        "campaigns",
        campaignId,
        "challenges",
      ),
      orderBy("updatedAt", "desc"),
      limit(PAGE_SIZE),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const challenges: Challenge[] = [];
        for (const doc of snap.docs) {
          try {
            challenges.push(
              firestoreToChallenge({
                id: doc.id,
                data: () => doc.data() ?? undefined,
              }),
            );
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn(
              "[challenges] skipping malformed challenge",
              doc.id,
              err,
            );
          }
        }
        setState({ status: "live", challenges, error: null });
      },
      (err) =>
        setState((prev) => ({
          status: "error",
          challenges: prev.challenges,
          error: err,
        })),
    );
    return unsubscribe;
  }, [campaignId]);

  return state;
}
