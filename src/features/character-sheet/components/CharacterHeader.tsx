"use client";
import { useCharacter } from "./CharacterProvider";

export function CharacterHeader() {
  const { character } = useCharacter();
  return (
    <section
      className="bg-parchment-soft px-4 py-4 dark:bg-ink-soft md:px-6"
      aria-live="polite"
    >
      <h1 className="font-display text-2xl tracking-tight text-ink-base dark:text-parchment-base">
        {character.identity.name || "Unnamed hero"}
      </h1>
      <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
        {character.identity.concept || "—"}
      </p>
    </section>
  );
}
