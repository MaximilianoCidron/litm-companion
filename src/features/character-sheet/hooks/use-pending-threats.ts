"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { getFirebaseDb } from "@/shared/firebase/client";
import { firestoreToPendingThreat } from "../lib/serialize";
import type { PendingThreat } from "../schemas";

export interface PendingThreatsState {
  pendingThreats: readonly PendingThreat[];
  error: Error | null;
}

/**
 * Live listener over active pending threats (awaitingReaction +
 * reactionRolled). Resolved/canceled threats fall off via the query filter.
 */
export function usePendingThreats(
  campaignId: string | null,
): PendingThreatsState {
  const [state, setState] = useState<PendingThreatsState>({
    pendingThreats: [],
    error: null,
  });

  useEffect(() => {
    if (!campaignId) {
      const t = setTimeout(
        () => setState({ pendingThreats: [], error: null }),
        0,
      );
      return () => clearTimeout(t);
    }
    const q = query(
      collection(
        getFirebaseDb(),
        "campaigns",
        campaignId,
        "pendingThreats",
      ),
      where("status", "in", ["awaitingReaction", "reactionRolled"]),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: PendingThreat[] = [];
        for (const doc of snap.docs) {
          try {
            list.push(
              firestoreToPendingThreat({
                id: doc.id,
                data: () => doc.data() ?? undefined,
              }),
            );
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn("[pending-threats] skip malformed", doc.id, err);
          }
        }
        setState({ pendingThreats: list, error: null });
      },
      (err) =>
        setState((prev) => ({
          pendingThreats: prev.pendingThreats,
          error: err,
        })),
    );
    return unsub;
  }, [campaignId]);

  return state;
}
