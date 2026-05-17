import { ThemeCardPlaceholder } from "../ThemeCardPlaceholder";
import type { Character } from "../../schemas";

export function ThemesSection({ character }: { character: Character }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {character.themes.map((theme) => (
        <ThemeCardPlaceholder
          key={theme.id}
          title={theme.title}
          type={theme.type}
        />
      ))}
    </div>
  );
}
