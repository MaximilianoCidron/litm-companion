"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getFirebaseDb } from "@/shared/firebase/client";
import { firestoreToInvitation } from "../lib/serialize";
import type { Invitation } from "../schemas";

export type DirectedInvitation = Extract<Invitation, { kind: "directed" }>;

/**
 * Live listener for directed invitations addressed to `uid`. Filters expired
 * docs at read time — there's no background cleanup job in v1; expired
 * entries linger in Firestore but never reach the user. Composite index
 * (directedAtUid, status) is required.
 */
export function useIncomingInvitations(
  uid: string | null,
): DirectedInvitation[] {
  const [invitations, setInvitations] = useState<DirectedInvitation[]>([]);

  useEffect(() => {
    if (!uid) {
      const t = setTimeout(() => setInvitations([]), 0);
      return () => clearTimeout(t);
    }
    const q = query(
      collection(getFirebaseDb(), "invitations"),
      where("directedAtUid", "==", uid),
      where("status", "==", "open"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const now = Date.now();
        const list: DirectedInvitation[] = [];
        for (const d of snap.docs) {
          try {
            const inv = firestoreToInvitation({
              id: d.id,
              data: () => d.data() ?? undefined,
            });
            if (inv.kind !== "directed") continue;
            if (new Date(inv.expiresAt).getTime() <= now) continue;
            list.push(inv);
          } catch (err) {
            console.warn("[invitations] malformed", d.id, err);
          }
        }
        list.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        );
        setInvitations(list);
      },
      (err) => {
        console.warn("[invitations] listener error", err);
      },
    );
    return unsub;
  }, [uid]);

  return invitations;
}
