import { notFound } from "next/navigation";
import { HeroSection, getCharacterStub } from "@/features/character-sheet";

export default async function HeroPage({
  params,
}: {
  params: Promise<{ charId: string }>;
}) {
  const { charId } = await params;
  const character = await getCharacterStub(charId);
  if (!character) notFound();
  return <HeroSection character={character} />;
}
