"use client";

import { ShieldCheck, X } from "lucide-react";
import {
  useReactingToPendingThreatId,
  useRollBuilder,
} from "../../stores/roll-builder";

/**
 * Header pill shown when the roll panel is mid-reaction. Click X to abort
 * the reaction (client-side only — the pending threat doc is untouched).
 */
export function ReactingIndicator() {
  const reactingTo = useReactingToPendingThreatId();
  if (!reactingTo) return null;
  return (
    <div className="mx-3 mt-2 inline-flex items-center gap-1.5 self-start rounded bg-ember/15 px-2 py-1 text-xs text-ember-text-light dark:text-ember-text-dark">
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      Reacting to incoming threat
      <button
        type="button"
        onClick={() => useRollBuilder.getState().clearReaction()}
        className="ml-1 inline-flex items-center"
        aria-label="Cancel reaction context"
      >
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}
