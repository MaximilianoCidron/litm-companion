"use server";
import { requireUser } from "@/shared/firebase/session";

/**
 * Placeholder Server Action. The real implementation lands with the
 * Firestore data layer (writes go via Admin SDK after cookie re-verify).
 * Kept here so the dialog can wire `useTransition` against a real action.
 */
export async function createCharacterPlaceholderAction(
  _name: string,
): Promise<{ ok: true }> {
  await requireUser();
  return { ok: true };
}
