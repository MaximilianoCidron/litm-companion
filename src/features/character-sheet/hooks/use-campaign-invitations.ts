// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getFirebaseDb } from "@/shared/firebase/client";
import { InvitationSchema, type Invitation } from "../schemas";

function tsToIso(value: unknown): string {
  if (
    value &&
    typeof value === "object" &&
    "toDate" in value &&
    typeof (value as Timestamp).toDate === "function"
  ) {
    return (value as Timestamp).toDate().toISOString();
  }
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  return new Date().toISOString();
}

function tsToIsoNullable(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return tsToIso(value);
}

interface InvitationsState {
  invitations: Invitation[];
  error: Error | null;
}

/**
 * Live listener for open invitations on a campaign. Subscribes lazily — when
 * `campaignId` is null, no listener is created. Backed by a Firestore query
 * on `(campaignId, status == "open")` so the GM sees revoke + create
 * round-trip in real time.
 */
export function useCampaignInvitations(
  campaignId: string | null,
): InvitationsState {
  const [state, setState] = useState<InvitationsState>({
    invitations: [],
    error: null,
  });

  useEffect(() => {
    if (!campaignId) {
      setState({ invitations: [], error: null });
      return;
    }
    const q = query(
      collection(getFirebaseDb(), "invitations"),
      where("campaignId", "==", campaignId),
      where("status", "==", "open"),
    );
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        try {
          const list = snap.docs.map((d) => {
            const data = d.data();
            return InvitationSchema.parse({
              ...data,
              id: d.id,
              createdAt: tsToIso(data.createdAt),
              expiresAt: tsToIso(data.expiresAt),
              consumedAt: tsToIsoNullable(data.consumedAt),
            });
          });
          setState({ invitations: list, error: null });
        } catch (err) {
          setState((prev) => ({
            invitations: prev.invitations,
            error: err instanceof Error ? err : new Error("Parse failed"),
          }));
        }
      },
      (err) => {
        setState((prev) => ({ invitations: prev.invitations, error: err }));
      },
    );
    return unsubscribe;
  }, [campaignId]);

  return state;
}
