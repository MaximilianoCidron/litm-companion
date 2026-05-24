"use client";
import { Target } from "lucide-react";
import { PendingAllocationRow } from "./pending-allocation-row";
import type { PendingAllocation } from "../../../lib/queries";

interface PendingAllocationsPanelProps {
  allocations: readonly PendingAllocation[];
}

export function PendingAllocationsPanel({
  allocations,
}: PendingAllocationsPanelProps) {
  if (allocations.length === 0) return null;
  return (
    <section className="rounded-lg border border-ember/40 bg-ember/5 p-4 dark:bg-ember/10">
      <header className="mb-3 flex items-center gap-2">
        <Target className="h-5 w-5 text-ember" aria-hidden="true" />
        <h2 className="font-display text-base text-ink-base dark:text-parchment-base">
          Pending allocations
          <span className="numeric ml-2 text-xs text-ink-muted dark:text-parchment-muted">
            ({allocations.length})
          </span>
        </h2>
      </header>
      <p className="mb-3 text-xs text-ink-muted dark:text-parchment-muted">
        Detailed action rolls waiting for Power allocation. You can allocate on
        behalf of any player.
      </p>
      <div className="flex flex-col gap-2">
        {allocations.map((a) => (
          <PendingAllocationRow key={a.rollId} allocation={a} />
        ))}
      </div>
    </section>
  );
}
