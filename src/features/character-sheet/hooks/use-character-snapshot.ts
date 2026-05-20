"use client";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseDb } from "@/shared/firebase/client";
import { firestoreToCharacter } from "../lib/serialize";
import type { Character } from "../schemas";

export type CharacterSnapshotState =
  | { status: "live"; character: Character; error: null }
  | { status: "error"; character: Character; error: Error };

/**
 * Live Firestore listener for a single character. Always keeps the last known
 * good character in state — transient listener errors do not blank the UI.
 * `<ConnectionBanner />` surfaces the `error` field discreetly.
 */
export function useCharacterSnapshot(
  charId: string,
  initial: Character,
): CharacterSnapshotState {
  const [state, setState] = useState<CharacterSnapshotState>({
    status: "live",
    character: initial,
    error: null,
  });

  useEffect(() => {
    const ref = doc(getFirebaseDb(), "characters", charId);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setState((prev) => ({
            status: "error",
            character: prev.character,
            error: new Error("Character no longer exists"),
          }));
          return;
        }
        try {
          const character = firestoreToCharacter({
            id: snap.id,
            data: () => snap.data() ?? undefined,
          });
          setState({ status: "live", character, error: null });
        } catch (err) {
          setState((prev) => ({
            status: "error",
            character: prev.character,
            error: err instanceof Error ? err : new Error("Parse failed"),
          }));
        }
      },
      (err) => {
        setState((prev) => ({
          status: "error",
          character: prev.character,
          error: err,
        }));
      },
    );
    return unsubscribe;
  }, [charId]);

  return state;
}
