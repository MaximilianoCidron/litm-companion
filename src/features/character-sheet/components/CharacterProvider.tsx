"use client";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useCharacterSnapshot } from "../hooks/use-character-snapshot";
import { useRollBuilder } from "../stores/roll-builder";
import type { Character } from "../schemas";

export type CharacterRole = "owner" | "gm";

interface CharacterContextValue {
  character: Character;
  role: CharacterRole;
  error: Error | null;
}

const CharacterContext = createContext<CharacterContextValue | null>(null);

interface CharacterProviderProps {
  initial: Character;
  role: CharacterRole;
  children: ReactNode;
}

export function CharacterProvider({
  initial,
  role,
  children,
}: CharacterProviderProps) {
  const { character, error } = useCharacterSnapshot(initial.id, initial);

  // Reset the roll builder when the active character changes — the picker
  // would otherwise carry over stale selections from a different sheet.
  useEffect(() => {
    useRollBuilder.getState().reset();
  }, [initial.id]);

  return (
    <CharacterContext.Provider value={{ character, role, error }}>
      {children}
    </CharacterContext.Provider>
  );
}

export function useCharacter(): CharacterContextValue {
  const ctx = useContext(CharacterContext);
  if (!ctx) {
    throw new Error("useCharacter must be used inside <CharacterProvider>.");
  }
  return ctx;
}
