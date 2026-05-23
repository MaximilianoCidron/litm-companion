"use server";
import { withAction } from "@/shared/auth";
import { FetchEndOfSessionSummaryInput } from "../schemas";
import {
  getEndOfSessionSummary,
  type EndOfSessionSummary,
} from "../lib/queries";

// Server Action wrapper around `getEndOfSessionSummary` so the
// EndSessionDialog can call it from a Client Component via the standard
// useActionWithToast pattern.
export const fetchEndOfSessionSummary = withAction(
  FetchEndOfSessionSummaryInput,
  async (input, ctx): Promise<EndOfSessionSummary> => {
    return getEndOfSessionSummary(input.campaignId, ctx.uid);
  },
);
