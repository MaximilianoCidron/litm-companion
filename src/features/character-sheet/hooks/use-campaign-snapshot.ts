"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/shared/firebase/client";
import { firestoreToCampaign } from "../lib/serialize";
import type { Campaign } from "../schemas";

export type CampaignSnapshotState =
  | { status: "none" }
  | { status: "live"; campaign: Campaign; error: null }
  | { status: "error"; campaign: Campaign | null; error: Error };

/**
 * Live Firestore listener for a campaign. Resubscribes when `campaignId`
 * changes (e.g. the character joins a campaign after page load). Initial
 * value is supplied from the server fetch so the first render is hydrated.
 */
export function useCampaignSnapshot(
  campaignId: string | null,
  initial: Campaign | null,
): CampaignSnapshotState {
  const [state, setState] = useState<CampaignSnapshotState>(() =>
    initial
      ? { status: "live", campaign: initial, error: null }
      : { status: "none" },
  );

  useEffect(() => {
    if (!campaignId) {
      setState({ status: "none" });
      return;
    }
    const ref = doc(getFirebaseDb(), "campaigns", campaignId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setState((prev) => ({
            status: "error",
            campaign: prev.status === "live" ? prev.campaign : null,
            error: new Error("Campaign no longer exists"),
          }));
          return;
        }
        try {
          const campaign = firestoreToCampaign({
            id: snap.id,
            data: () => snap.data() ?? undefined,
          });
          setState({ status: "live", campaign, error: null });
        } catch (err) {
          setState((prev) => ({
            status: "error",
            campaign: prev.status === "live" ? prev.campaign : null,
            error: err instanceof Error ? err : new Error("Parse failed"),
          }));
        }
      },
      (err) => {
        setState((prev) => ({
          status: "error",
          campaign: prev.status === "live" ? prev.campaign : null,
          error: err,
        }));
      },
    );
    return unsubscribe;
  }, [campaignId]);

  return state;
}
