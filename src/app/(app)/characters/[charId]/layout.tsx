import { notFound } from "next/navigation";
import { BookTabBarMobile, BookTabNav, getCharacterStub } from "@/features/character-sheet";

export default async function CharacterLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ charId: string }>;
}) {
  const { charId } = await params;
  // TODO: replace with Admin SDK Firestore query.
  const character = await getCharacterStub(charId);
  if (!character) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <section className="bg-parchment-soft px-4 py-4 dark:bg-ink-soft md:px-6">
        <h1 className="font-display text-2xl tracking-tight text-ink-base dark:text-parchment-base">
          {character.name}
        </h1>
        <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
          {character.concept}
        </p>
      </section>

      <BookTabBarMobile charId={character.id} />

      <div className="flex flex-1 flex-col md:flex-row">
        <BookTabNav charId={character.id} />
        <main className="flex-1 bg-parchment p-6 dark:bg-ink md:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
