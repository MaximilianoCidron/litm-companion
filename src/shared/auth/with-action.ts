import "server-only";
import type { z } from "zod";
import { ActionError, type ActionResult } from "./errors";
import { requireAuth, type AuthContext } from "./require-auth";

/**
 * Wrap a Server Action handler with:
 * 1. Session re-verification (defense-in-depth vs CVE-2025-29927).
 * 2. Zod input validation.
 * 3. Uniform ActionResult error envelope.
 */
export function withAction<Schema extends z.ZodTypeAny, Output>(
  schema: Schema,
  handler: (
    input: z.output<Schema>,
    ctx: AuthContext,
  ) => Promise<Output>,
): (raw: unknown) => Promise<ActionResult<Output>> {
  return async (raw) => {
    try {
      const ctx = await requireAuth();
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        return {
          ok: false,
          error: {
            code: "VALIDATION",
            message: "Invalid input",
            issues: parsed.error.issues,
          },
        };
      }
      const data = await handler(parsed.data, ctx);
      return { ok: true, data };
    } catch (err) {
      if (err instanceof ActionError) {
        return {
          ok: false,
          error: { code: err.code, message: err.message },
        };
      }
      console.error("[action] unexpected error:", err);
      return {
        ok: false,
        error: { code: "INTERNAL", message: "Something went wrong" },
      };
    }
  };
}
