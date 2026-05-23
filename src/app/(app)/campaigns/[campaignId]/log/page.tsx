import { getSessionUser } from "@/shared/auth";
import { SessionLogView } from "@/features/character-sheet";

export default async function SessionLogPage() {
  const user = await getSessionUser();
  return <SessionLogView currentUid={user.uid} />;
}
