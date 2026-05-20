"use client";
import { cn } from "@/shared/lib/cn";
import { useCharacter } from "../CharacterProvider";
import {
  useInvokedStatuses,
  useRollBuilder,
} from "../../stores/roll-builder";
import type { Status, StatusId } from "../../schemas";

function StatusRow({
  status,
  isInvoked,
  isHighest,
}: {
  status: Status;
  isInvoked: boolean;
  isHighest: boolean;
}) {
  const toggleStatus = useRollBuilder((s) => s.toggleStatus);
  const helpful = status.polarity === "helpful";
  const signedTier = helpful ? status.tier : -status.tier;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isInvoked}
      onClick={() => toggleStatus(status.id as StatusId)}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2 text-left transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
        isInvoked
          ? helpful
            ? "bg-moss-soft/40 dark:bg-moss-soft-dark/40"
            : "bg-rust-soft/40 dark:bg-rust-soft-dark/40"
          : "hover:bg-parchment-soft dark:hover:bg-ink-soft",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border",
          isInvoked
            ? "border-ember bg-ember"
            : "border-mist-light dark:border-mist-dark",
        )}
      >
        {isInvoked ? (
          <span className="h-2 w-2 rounded-sm bg-parchment-elevated" />
        ) : null}
      </span>
      <span className="flex-1 text-sm">
        {status.name || "(unnamed)"}
        <span className="ml-2 numeric text-xs text-ink-subtle dark:text-parchment-subtle">
          · {status.tier}
        </span>
        {isHighest ? (
          <span className="ml-2 text-[10px] uppercase tracking-wider text-ember-text-light dark:text-ember-text-dark">
            highest
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "numeric font-display text-sm",
          helpful
            ? "text-moss-text dark:text-moss-text-dark"
            : "text-rust-text dark:text-rust-text-dark",
        )}
      >
        {signedTier > 0 ? `+${signedTier}` : signedTier}
      </span>
    </button>
  );
}

function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-parchment-soft px-3 py-2 font-display text-xs uppercase tracking-wider text-ink-muted dark:bg-ink-soft dark:text-parchment-muted">
      {children}
    </div>
  );
}

export function StatusPicker() {
  const { character } = useCharacter();
  const invoked = useInvokedStatuses();

  const helpful = character.statuses.filter((s) => s.polarity === "helpful");
  const hindering = character.statuses.filter(
    (s) => s.polarity === "hindering",
  );

  const invokedHelpfulTiers = helpful
    .filter((s) => invoked.has(s.id as StatusId))
    .map((s) => s.tier);
  const invokedHinderingTiers = hindering
    .filter((s) => invoked.has(s.id as StatusId))
    .map((s) => s.tier);
  const maxHelpful =
    invokedHelpfulTiers.length > 0 ? Math.max(...invokedHelpfulTiers) : 0;
  const maxHindering =
    invokedHinderingTiers.length > 0 ? Math.max(...invokedHinderingTiers) : 0;

  let helpfulHighestSeen = false;
  let hinderingHighestSeen = false;

  return (
    <div className="flex flex-col">
      <GroupHeader>Helpful statuses</GroupHeader>
      {helpful.length === 0 ? (
        <p className="px-3 py-2 text-xs italic text-ink-subtle dark:text-parchment-subtle">
          None active.
        </p>
      ) : (
        helpful.map((s) => {
          const isInvoked = invoked.has(s.id as StatusId);
          const isHighest =
            isInvoked && s.tier === maxHelpful && !helpfulHighestSeen;
          if (isHighest) helpfulHighestSeen = true;
          return (
            <StatusRow
              key={s.id}
              status={s}
              isInvoked={isInvoked}
              isHighest={isHighest}
            />
          );
        })
      )}
      <GroupHeader>Hindering statuses</GroupHeader>
      {hindering.length === 0 ? (
        <p className="px-3 py-2 text-xs italic text-ink-subtle dark:text-parchment-subtle">
          None active.
        </p>
      ) : (
        hindering.map((s) => {
          const isInvoked = invoked.has(s.id as StatusId);
          const isHighest =
            isInvoked && s.tier === maxHindering && !hinderingHighestSeen;
          if (isHighest) hinderingHighestSeen = true;
          return (
            <StatusRow
              key={s.id}
              status={s}
              isInvoked={isInvoked}
              isHighest={isHighest}
            />
          );
        })
      )}
    </div>
  );
}
