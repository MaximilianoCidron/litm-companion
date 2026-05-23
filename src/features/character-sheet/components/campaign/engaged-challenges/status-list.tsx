"use client";
import { cn } from "@/shared/lib/cn";
import type { Status } from "../../../schemas";

interface StatusListProps {
  statuses: readonly Status[];
}

export function StatusList({ statuses }: StatusListProps) {
  if (statuses.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {statuses.map((s) => {
        const helpful = s.polarity === "helpful";
        const signed = helpful ? s.tier : -s.tier;
        return (
          <li
            key={s.id}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs",
              helpful
                ? "border-moss/40 bg-moss-soft/30 text-moss-text dark:border-moss-dark/40 dark:bg-moss-soft-dark/30 dark:text-moss-text-dark"
                : "border-rust/40 bg-rust-soft/30 text-rust-text dark:border-rust-dark/40 dark:bg-rust-soft-dark/30 dark:text-rust-text-dark",
            )}
          >
            <span className="font-medium">{s.name || "(unnamed)"}</span>
            <span className="numeric font-display">
              {signed > 0 ? `+${signed}` : signed}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
