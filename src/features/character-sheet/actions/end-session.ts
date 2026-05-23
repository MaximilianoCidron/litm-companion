"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { EndSessionInput } from "../schemas";
import { requireCampaignGm } from "../lib/access";
import { firestoreToSession } from "../lib/serialize";
import {
  getAuthorDisplayName,
  writeLogEntry,
} from "../lib/session-log";

interface EndSessionResult {
  sessionId: string;
  sessionNumber: number;
}

export const endSession = withAction(
  EndSessionInput,
  async (input, ctx): Promise<EndSessionResult> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      const { snap: campSnap } = await requireCampaignGm(
        input.campaignId,
        ctx.uid,
        tx,
      );
      const activeSessionId =
        (campSnap.data()?.activeSessionId as string | null | undefined) ??
        null;
      if (!activeSessionId) {
        throw new ActionError("INVALID_STATE", "No session in progress.");
      }
      const sessionRef = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("sessions")
        .doc(activeSessionId);
      const sessionSnap = await tx.get(sessionRef);
      if (!sessionSnap.exists) {
        throw new ActionError(
          "NOT_FOUND",
          "Active session document missing.",
        );
      }
      const session = firestoreToSession(sessionSnap);

      const notes = input.notes ?? "";
      tx.update(sessionRef, {
        endedAt: FieldValue.serverTimestamp(),
        endedByUid: ctx.uid,
        notes,
      });
      tx.update(campSnap.ref, {
        activeSessionId: null,
        activeSessionNumber: null,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const truncated =
        notes.length > 200 ? `${notes.slice(0, 200)}…` : notes;
      const text = notes
        ? `Session ${session.sessionNumber} ended. "${truncated}"`
        : `Session ${session.sessionNumber} ended.`;
      writeLogEntry(tx, {
        campaignId: input.campaignId,
        authorUid: ctx.uid,
        authorName: getAuthorDisplayName(ctx),
        subjectCharacterId: null,
        subjectCharacterName: null,
        text,
        details: {
          kind: "sessionBoundary",
          boundary: "end",
          sessionNumber: session.sessionNumber,
          sessionId: session.id,
        },
        sessionId: session.id,
        pinned: true,
      });

      return { sessionId: session.id, sessionNumber: session.sessionNumber };
    });
  },
);
