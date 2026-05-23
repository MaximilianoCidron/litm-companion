"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/shared/firebase/client";
import { firestoreToChallenge } from "../lib/serialize";
import type { Challenge } from "../schemas";

export type ChallengeSnapshotState =
  | { status: "live"; challenge: Challenge; error: null }
  | { status: "error"; challenge: Challenge; error: Error };

/**
 * Live Firestore listener for a single challenge. Initial value comes from
 * the server fetch so the first render is hydrated. Transient parse / listener
 * errors keep the last-known-good challenge in state and surface the error.
 */
export function useChallengeSnapshot(
  campaignId: string,
  challengeId: string,
  initial: Challenge,
): ChallengeSnapshotState {
  const [state, setState] = useState<ChallengeSnapshotState>({
    status: "live",
    challenge: initial,
    error: null,
  });

  useEffect(() => {
    const ref = doc(
      getFirebaseDb(),
      "campaigns",
      campaignId,
      "challenges",
      challengeId,
    );
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setState((prev) => ({
            status: "error",
            challenge: prev.challenge,
            error: new Error("Challenge no longer exists"),
          }));
          return;
        }
        try {
          const challenge = firestoreToChallenge({
            id: snap.id,
            data: () => snap.data() ?? undefined,
          });
          setState({ status: "live", challenge, error: null });
        } catch (err) {
          setState((prev) => ({
            status: "error",
            challenge: prev.challenge,
            error: err instanceof Error ? err : new Error("Parse failed"),
          }));
        }
      },
      (err) =>
        setState((prev) => ({
          status: "error",
          challenge: prev.challenge,
          error: err,
        })),
    );
    return unsubscribe;
  }, [campaignId, challengeId]);

  return state;
}
