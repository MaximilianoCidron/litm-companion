"use client";
import { cn } from "@/shared/lib/cn";
import { useCharacter } from "../CharacterProvider";
import { useCampaign } from "../CampaignProvider";
import {
  makeStatusKey,
  useInvokedStatuses,
  useRollBuilder,
  type InvokedStatusEntry,
  type StatusInvocationKey,
} from "../../stores/roll-builder";
import type { Status, StatusId, StatusLocation } from "../../schemas";

function StatusRow({
  status,
  location,
  isInvoked,
  isHighest,
}: {
  status: Status;
  location: StatusLocation;
  isInvoked: boolean;
  isHighest: boolean;
}) {
  const toggleStatus = useRollBuilder((s) => s.toggleStatus);
  const helpful = status.polarity === "helpful";
  const signedTier = helpful ? status.tier : -status.tier;
  const key = makeStatusKey(location, status.id as StatusId);
  const entry: InvokedStatusEntry = { statusId: status.id as StatusId, location };
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isInvoked}
      onClick={() => toggleStatus(key, entry)}
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

function renderStatusGroup(
  statuses: readonly Status[],
  locationFor: (s: Status) => StatusLocation,
  invoked: Map<StatusInvocationKey, InvokedStatusEntry>,
  polarity: "helpful" | "hindering",
) {
  const filtered = statuses.filter((s) => s.polarity === polarity);
  if (filtered.length === 0) return null;
  const invokedTiers = filtered
    .filter((s) =>
      invoked.has(makeStatusKey(locationFor(s), s.id as StatusId)),
    )
    .map((s) => s.tier);
  const max = invokedTiers.length > 0 ? Math.max(...invokedTiers) : 0;
  let highestSeen = false;
  return filtered.map((s) => {
    const location = locationFor(s);
    const key = makeStatusKey(location, s.id as StatusId);
    const isInvoked = invoked.has(key);
    const isHighest = isInvoked && s.tier === max && !highestSeen;
    if (isHighest) highestSeen = true;
    return (
      <StatusRow
        key={key}
        status={s}
        location={location}
        isInvoked={isInvoked}
        isHighest={isHighest}
      />
    );
  });
}

export function StatusPicker() {
  const { character } = useCharacter();
  const campaign = useCampaign();
  const invoked = useInvokedStatuses();

  const characterLocation: StatusLocation = { kind: "character" };
  const characterHelpful = renderStatusGroup(
    character.statuses,
    () => characterLocation,
    invoked,
    "helpful",
  );
  const characterHindering = renderStatusGroup(
    character.statuses,
    () => characterLocation,
    invoked,
    "hindering",
  );

  const challengesWithStatuses =
    campaign.status !== "none"
      ? campaign.engagedChallenges.filter((c) => c.statuses.length > 0)
      : [];

  return (
    <div className="flex flex-col">
      <GroupHeader>Helpful statuses</GroupHeader>
      {characterHelpful === null ? (
        <p className="px-3 py-2 text-xs italic text-ink-subtle dark:text-parchment-subtle">
          None active.
        </p>
      ) : (
        characterHelpful
      )}
      <GroupHeader>Hindering statuses</GroupHeader>
      {characterHindering === null ? (
        <p className="px-3 py-2 text-xs italic text-ink-subtle dark:text-parchment-subtle">
          None active.
        </p>
      ) : (
        characterHindering
      )}
      {challengesWithStatuses.map((challenge) => {
        const locationFor = (): StatusLocation => ({
          kind: "challenge",
          campaignId: challenge.campaignId,
          challengeId: challenge.id,
        });
        const helpful = renderStatusGroup(
          challenge.statuses,
          locationFor,
          invoked,
          "helpful",
        );
        const hindering = renderStatusGroup(
          challenge.statuses,
          locationFor,
          invoked,
          "hindering",
        );
        return (
          <div key={challenge.id} className="flex flex-col">
            <GroupHeader>
              <div className="flex items-center justify-between gap-2">
                <span>{challenge.name} · statuses</span>
              </div>
            </GroupHeader>
            {helpful}
            {hindering}
          </div>
        );
      })}
    </div>
  );
}
