"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { ActionError, withAction } from "@/shared/auth";
import { SessionId, StartSessionInput } from "../schemas";
import { requireCampaignGm } from "../lib/access";
import {
  getAuthorDisplayName,
  writeLogEntry,
} from "../lib/session-log";

interface StartSessionResult {
  sessionId: string;
  sessionNumber: number;
}

export const startSession = withAction(
  StartSessionInput,
  async (input, ctx): Promise<StartSessionResult> => {
    const db = getAdminDb();
    return db.runTransaction(async (tx) => {
      const { snap: campSnap } = await requireCampaignGm(
        input.campaignId,
        ctx.uid,
        tx,
      );
      const existing =
        (campSnap.data()?.activeSessionId as string | null | undefined) ??
        null;
      if (existing) {
        throw new ActionError(
          "INVALID_STATE",
          "A session is already in progress. End it first.",
        );
      }

      // Determine next sessionNumber by reading the highest existing one.
      const prevQuery = await tx.get(
        db
          .collection("campaigns")
          .doc(input.campaignId)
          .collection("sessions")
          .orderBy("sessionNumber", "desc")
          .limit(1),
      );
      const prevMax = prevQuery.empty
        ? 0
        : (prevQuery.docs[0]!.data().sessionNumber as number);
      const nextNumber = prevMax + 1;

      const sessionRef = db
        .collection("campaigns")
        .doc(input.campaignId)
        .collection("sessions")
        .doc();
      const sessionId = SessionId.parse(sessionRef.id);

      tx.set(sessionRef, {
        id: sessionRef.id,
        campaignId: input.campaignId,
        sessionNumber: nextNumber,
        startedByUid: ctx.uid,
        startedAt: FieldValue.serverTimestamp(),
        endedAt: null,
        endedByUid: null,
        title: input.title ?? "",
        notes: "",
      });

      tx.update(campSnap.ref, {
        activeSessionId: sessionId,
        activeSessionNumber: nextNumber,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const text = input.title
        ? `Session ${nextNumber} began: "${input.title}"`
        : `Session ${nextNumber} began.`;
      writeLogEntry(tx, {
        campaignId: input.campaignId,
        authorUid: ctx.uid,
        authorName: getAuthorDisplayName(ctx),
        subjectCharacterId: null,
        subjectCharacterName: null,
        text,
        details: {
          kind: "sessionBoundary",
          boundary: "start",
          sessionNumber: nextNumber,
          sessionId,
        },
        sessionId,
        pinned: true,
      });

      return { sessionId, sessionNumber: nextNumber };
    });
  },
);
