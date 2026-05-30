"use client";
import { useCallback } from "react";
import { toast } from "@/shared/ui";
import type { ActionResult } from "@/shared/auth";

interface CallOptions<T> {
  /**
   * Success toast title. A function form receives the action's data payload,
   * letting callers template the message (e.g. counts) off the result.
   */
  onSuccess?: string | ((data: T) => string);
  onError?: (msg: string) => void;
}

export type CallActionFn = <T>(
  promise: Promise<ActionResult<T>>,
  opts?: CallOptions<T>,
) => Promise<T | null>;

/**
 * Wrap Server Action invocations from Client Components. Maps the uniform
 * ActionResult envelope to project toasts (`toast.error` / `toast.success`).
 * Returns the action's data payload on success, or `null` on failure.
 */
export function useActionWithToast(): CallActionFn {
  return useCallback(
    async <T>(
      promise: Promise<ActionResult<T>>,
      opts?: CallOptions<T>,
    ): Promise<T | null> => {
      const result = await promise;
      if (!result.ok) {
        const msg = result.error.message;
        toast.error("Something went wrong", { description: msg });
        opts?.onError?.(msg);
        return null;
      }
      if (opts?.onSuccess) {
        const title =
          typeof opts.onSuccess === "function"
            ? opts.onSuccess(result.data)
            : opts.onSuccess;
        toast.success(title);
      }
      return result.data;
    },
    [],
  );
}
