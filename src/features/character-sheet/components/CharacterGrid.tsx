import { CharacterGridCard } from "./CharacterGridCard";
import { CreateCharacterCard } from "./CreateCharacterCard";
import type { CharacterSummary } from "../schemas";

export function CharacterGrid({
  characters,
}: {
  characters: CharacterSummary[];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {characters.map((c) => (
        <CharacterGridCard key={c.id} char={c} />
      ))}
      <CreateCharacterCard />
    </div>
  );
}
