"use client";
import { useState } from "react";
import { Button } from "@/shared/ui";
import { formatRelativeTime } from "@/shared/lib/format";
import { AllocationDialog } from "./allocation-dialog";
import type { PendingAllocation } from "../../../lib/queries";

interface PendingAllocationRowProps {
  allocation: PendingAllocation;
}

export function PendingAllocationRow({ allocation }: PendingAllocationRowProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-3 rounded bg-parchment-elevated px-3 py-2 dark:bg-ink-elevated">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-base dark:text-parchment-base">
          <span className="font-display">{allocation.characterName}</span>
          <span className="text-xs text-ink-muted dark:text-parchment-muted">
            {" · against "}
          </span>
          <span className="font-display">{allocation.challengeName}</span>
        </p>
        <p className="text-xs text-ink-muted dark:text-parchment-muted">
          Rolled <span className="numeric">{allocation.power}</span> Power ·{" "}
          {formatRelativeTime(allocation.createdAt)}
        </p>
      </div>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Allocate now
      </Button>
      <AllocationDialog
        open={open}
        onOpenChange={setOpen}
        allocation={allocation}
      />
    </div>
  );
}
