"use server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/shared/firebase/admin";
import { withAction } from "@/shared/auth";
import { setThemeCookie } from "@/shared/auth/theme-cookie";
import { UpdateUserSettingsInput } from "../schemas";

export const updateUserSettings = withAction(
  UpdateUserSettingsInput,
  async (input, ctx): Promise<{ ok: true }> => {
    const db = getAdminDb();
    const ref = db.collection("userSettings").doc(ctx.uid);

    // Side effect: flipping hidePresence to true drops the presence doc for
    // an instant offline appearance. Future heartbeats are gated by the
    // HeartbeatLoop reading the same setting.
    if (input.patch.hidePresence === true) {
      try {
        await db.collection("presence").doc(ctx.uid).delete();
      } catch {
        // Doc may not exist — ignore.
      }
    }

    // Mirror themePreference to an httpOnly cookie so the root layout can
    // apply the dark class server-side on the next request — eliminates
    // first-render flash.
    if (input.patch.themePreference !== undefined) {
      try {
        await setThemeCookie(input.patch.themePreference);
      } catch (err) {
        console.warn("[update-user-settings] theme cookie write failed", err);
      }
    }

    // Strip undefined entries — Zod optional fields are undefined when the
    // caller omits them. Spreading undefined into a Firestore merge write
    // either errors (Admin SDK rejects undefined) or unintentionally clears
    // the field. We want a true partial update.
    const cleanPatch: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input.patch)) {
      if (v !== undefined) cleanPatch[k] = v;
    }

    await ref.set(
      {
        uid: ctx.uid,
        ...cleanPatch,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return { ok: true };
  },
);
