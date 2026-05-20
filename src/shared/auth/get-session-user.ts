import "server-only";
import { redirect } from "next/navigation";
import { ActionError } from "./errors";
import { requireAuth, type AuthContext } from "./require-auth";

/**
 * Server Component / Route Handler helper. Returns the authenticated user or
 * redirects to /login. Unlike `requireAuth` (used by Server Actions, which
 * surface errors as structured envelopes), Server Components should redirect
 * on missing/invalid sessions.
 */
export async function getSessionUser(): Promise<AuthContext> {
  try {
    return await requireAuth();
  } catch (err) {
    if (err instanceof ActionError && err.code === "UNAUTHENTICATED") {
      redirect("/login");
    }
    throw err;
  }
}
