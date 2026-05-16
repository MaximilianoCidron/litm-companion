import { redirect } from "next/navigation";
import { verifySessionCookie } from "@/shared/firebase/session";
import { LoginForm } from "@/features/auth";

export default async function LoginPage() {
  const claims = await verifySessionCookie();
  if (claims) {
    redirect("/dashboard");
  }
  return (
    <main className="flex min-h-dvh items-center justify-center bg-parchment px-4 dark:bg-ink">
      <LoginForm />
    </main>
  );
}
