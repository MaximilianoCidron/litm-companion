"use client";
import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { getFirebaseDb } from "@/shared/firebase/client";
import { firestoreToCharacter } from "../lib/serialize";
import type { Character } from "../schemas";

/**
 * Live listener for the caller's active (non-retired) characters. Used by
 * the directed-invitation accept dialog when the player picks a hero to
 * bring into the campaign. Retired heroes are filtered out — they can't
 * join campaigns.
 */
export function useMyActiveCharacters(
  uid: string | null,
): readonly Character[] {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    if (!uid) {
      const t = setTimeout(() => setCharacters([]), 0);
      return () => clearTimeout(t);
    }
    const q = query(
      collection(getFirebaseDb(), "characters"),
      where("userId", "==", uid),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list: Character[] = [];
        for (const d of snap.docs) {
          try {
            const character = firestoreToCharacter({
              id: d.id,
              data: () => d.data() ?? undefined,
            });
            if (character.status === "retired") continue;
            list.push(character);
          } catch (err) {
            console.warn("[characters] malformed", d.id, err);
          }
        }
        list.sort((a, b) => a.identity.name.localeCompare(b.identity.name));
        setCharacters(list);
      },
      (err) => {
        console.warn("[characters] listener error", err);
      },
    );
    return unsub;
  }, [uid]);

  return characters;
}
