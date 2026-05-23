"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/shared/firebase/client";
import { firestoreToEngagedChallenge } from "../lib/serialize";
import type { EngagedChallenge } from "../schemas";

export interface EngagedChallengesState {
  engagedChallenges: readonly EngagedChallenge[];
  error: Error | null;
}

/**
 * Live listener over `campaigns/{cid}/engagedChallenges`. Mirror docs only —
 * the GM-only challenge source is never read here. Returns an empty list
 * while loading (first snapshot lands in ~100ms); brief flash is acceptable
 * since opposing forces are a secondary view.
 */
export function useEngagedChallenges(
  campaignId: string | null,
): EngagedChallengesState {
  const [state, setState] = useState<EngagedChallengesState>({
    engagedChallenges: [],
    error: null,
  });

  useEffect(() => {
    if (!campaignId) {
      const t = setTimeout(
        () => setState({ engagedChallenges: [], error: null }),
        0,
      );
      return () => clearTimeout(t);
    }
    const ref = collection(
      getFirebaseDb(),
      "campaigns",
      campaignId,
      "engagedChallenges",
    );
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const list: EngagedChallenge[] = [];
        for (const doc of snap.docs) {
          try {
            list.push(
              firestoreToEngagedChallenge({
                id: doc.id,
                data: () => doc.data() ?? undefined,
              }),
            );
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn(
              "[engaged-challenges] skip malformed",
              doc.id,
              err,
            );
          }
        }
        setState({ engagedChallenges: list, error: null });
      },
      (err) =>
        setState((prev) => ({
          engagedChallenges: prev.engagedChallenges,
          error: err,
        })),
    );
    return unsub;
  }, [campaignId]);

  return state;
}
