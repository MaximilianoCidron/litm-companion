"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useCharacterSnapshot } from "../hooks/use-character-snapshot";
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
