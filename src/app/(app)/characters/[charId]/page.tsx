import { redirect } from "next/navigation";

export default async function CharacterIndexPage({
  params,
}: {
  params: Promise<{ charId: string }>;
}) {
  const { charId } = await params;
  redirect(`/characters/${charId}/hero`);
}
