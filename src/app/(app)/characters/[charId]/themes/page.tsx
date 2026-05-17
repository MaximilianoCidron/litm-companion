import { notFound } from "next/navigation";
import { ThemesSection, getCharacterStub } from "@/features/character-sheet";

export default async function ThemesPage({
  params,
}: {
  params: Promise<{ charId: string }>;
}) {
  const { charId } = await params;
  const character = await getCharacterStub(charId);
  if (!character) notFound();
  return <ThemesSection character={character} />;
}
