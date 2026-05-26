"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, query } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/shared/firebase/client";
import { firestoreToPendingThreat } from "../lib/serialize";
import type { CampaignId } from "../schemas/ids";
import type { PendingThreat } from "../schemas/pending-threat";
import type {
  AllocationForMe,
  ThreatForMe,
} from "../lib/inbox";

export interface InboxCampaign {
  id: CampaignId;
  gmUid: string;
  name: string;
}

export interface InboxCampaignThreatsResult {
  threatsForMe: ThreatForMe[];
  allocationsForMe: AllocationForMe[];
}

/**
 * Mount one `pendingThreats` listener per campaign the user is in, demultiplex
 * client-side into:
 *   - `threatsForMe`: status === "awaitingReaction" AND `targetUid === uid`
 *   - `allocationsForMe`: status === "reactionRolled" AND I'm the GM
 *
 * Listener attach gates on Firebase Auth client SDK readiness (see project
 * CLAUDE.md / memory: gate-listeners-on-client-auth-readiness) to avoid
 * permission-denied races during SSR hydration. `campaignKey` is the stable
 * useEffect dep so listeners don't re-mount on every parent re-render when
 * the campaign set is unchanged.
 */
export function useInboxCampaignPendingThreats(
  uid: string,
  campaigns: readonly InboxCampaign[],
): InboxCampaignThreatsResult {
  const [byCampaign, setByCampaign] = useState<
    ReadonlyMap<CampaignId, PendingThreat[]>
  >(new Map());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(getFirebaseAuth(), (user) => {
      setAuthReady(user !== null && user.uid === uid);
    });
    return unsub;
  }, [uid]);

  const key = campaignKey(campaigns);

  useEffect(() => {
    if (!authReady) return;
    if (campaigns.length === 0) return;
    // Note: when `campaigns` shrinks, stale entries in `byCampaign` for
    // removed ids are harmless — the render loop iterates over the current
    // `campaigns` only, so dropped entries are never read.
    const db = getFirebaseDb();
    const unsubs: Array<() => void> = [];

    for (const camp of campaigns) {
      const q = query(
        collection(db, "campaigns", camp.id, "pendingThreats"),
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const list: PendingThreat[] = [];
          for (const docSnap of snap.docs) {
            try {
              list.push(
                firestoreToPendingThreat({
                  id: docSnap.id,
                  data: () => docSnap.data() ?? undefined,
                }),
              );
            } catch (err) {
              console.warn(
                "[inbox-pending-threats] skipping malformed",
                docSnap.id,
                err,
              );
            }
          }
          setByCampaign((prev) => {
            const next = new Map(prev);
            next.set(camp.id, list);
            return next;
          });
        },
        (err) => {
          console.warn(
            "[inbox-pending-threats] listener error",
            camp.id,
            err,
          );
        },
      );
      unsubs.push(unsub);
    }

    return () => {
      for (const u of unsubs) u();
    };
    // `key` is the stable dep — re-mount listeners only when the campaign
    // set changes, not on every parent re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, key]);

  const result: InboxCampaignThreatsResult = {
    threatsForMe: [],
    allocationsForMe: [],
  };

  for (const camp of campaigns) {
    const threats = byCampaign.get(camp.id) ?? [];
    for (const t of threats) {
      if (t.status === "awaitingReaction" && t.targetUid === uid) {
        result.threatsForMe.push({ threat: t, campaignId: camp.id });
      } else if (t.status === "reactionRolled" && camp.gmUid === uid) {
        result.allocationsForMe.push({
          threat: t,
          campaignId: camp.id,
          campaignName: camp.name,
        });
      }
    }
  }

  return result;
}

function campaignKey(campaigns: readonly InboxCampaign[]): string {
  return campaigns
    .map((c) => c.id)
    .slice()
    .sort()
    .join(",");
}
