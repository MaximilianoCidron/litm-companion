"use client";
import { useCharacter } from "../CharacterProvider";
import { ThemeCard } from "../theme-card";

export function ThemesSection() {
  const { character, role } = useCharacter();
  const canEdit = role === "owner" || role === "gm";
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-4">
      {character.themes.map((theme) => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          characterId={character.id}
          canEdit={canEdit}
        />
      ))}
    </div>
  );
}
