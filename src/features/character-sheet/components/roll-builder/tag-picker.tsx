"use client";
import { Flame } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useCharacter } from "../CharacterProvider";
import {
  makeTagKey,
  useInvokedTags,
  useRollBuilder,
} from "../../stores/roll-builder";
import type { TagId, TagLocation } from "../../schemas";

interface TagRowProps {
  label: string;
  tagId: TagId;
  location: TagLocation;
  tagKind: "power" | "weakness" | "story";
  polarity: "helpful" | "hindering";
  baseValue: number;
  burnValue?: number;
  isInvoked: boolean;
  isBurnSelected: boolean;
  disabled: boolean;
  disabledReason?: string;
  burnable: boolean;
}

function TagRow({
  label,
  tagId,
  location,
  tagKind,
  polarity,
  baseValue,
  burnValue,
  isInvoked,
  isBurnSelected,
  disabled,
  disabledReason,
  burnable,
}: TagRowProps) {
  const toggleTag = useRollBuilder((s) => s.toggleTag);
  const toggleBurn = useRollBuilder((s) => s.toggleBurn);
  const key = makeTagKey(location, tagId);
  const effective = isBurnSelected && burnValue !== undefined ? burnValue : baseValue;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2 transition-colors",
        disabled && "opacity-50 cursor-not-allowed",
        !disabled && "hover:bg-parchment-soft dark:hover:bg-ink-soft",
        isInvoked && !disabled && "bg-ember/5 dark:bg-ember/10",
      )}
      title={disabled ? disabledReason : undefined}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={isInvoked}
        disabled={disabled}
        onClick={() => toggleTag(key, { tagId, location })}
        className={cn(
          "flex flex-1 items-center gap-3 text-left",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
          tagKind === "weakness" && "italic",
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
          {label || "(unnamed)"}
          {tagKind === "weakness" ? (
            <span className="ml-2 text-xs text-ink-subtle dark:text-parchment-subtle">
              · self-invoke
            </span>
          ) : null}
        </span>
        <span
          className={cn(
            "numeric font-display text-sm",
            polarity === "helpful"
              ? "text-tag-power-text dark:text-tag-power-text-dark"
              : "text-tag-weakness-text dark:text-tag-weakness-text-dark",
          )}
        >
          {effective > 0 ? `+${effective}` : effective}
        </span>
      </button>
      {burnable && isInvoked ? (
        <button
          type="button"
          aria-pressed={isBurnSelected}
          aria-label={isBurnSelected ? "Cancel burn" : "Burn for +3"}
          onClick={() => toggleBurn(key)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded transition-colors",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
            isBurnSelected
              ? "bg-crimson text-parchment-elevated"
              : "text-ink-muted hover:bg-parchment-elevated hover:text-crimson dark:text-parchment-muted dark:hover:bg-ink-elevated",
          )}
        >
          <Flame className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function GroupHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-parchment-soft px-3 py-2 font-display text-xs uppercase tracking-wider text-ink-muted dark:bg-ink-soft dark:text-parchment-muted">
      {children}
    </div>
  );
}

export function TagPicker() {
  const { character } = useCharacter();
  const invoked = useInvokedTags();

  return (
    <div className="flex flex-col">
      {character.themes.map((theme) => (
        <div key={theme.id} className="flex flex-col">
          <GroupHeader>
            <div className="flex items-center justify-between gap-2">
              <span>{theme.name || "Untitled theme"}</span>
              <span className="text-[10px] capitalize text-ink-subtle dark:text-parchment-subtle">
                {theme.mightLevel}
              </span>
            </div>
          </GroupHeader>
          {theme.powerTags.length === 0 ? (
            <p className="px-3 py-2 text-xs italic text-ink-subtle dark:text-parchment-subtle">
              No power tags.
            </p>
          ) : null}
          {theme.powerTags.map((tag) => {
            const location: TagLocation = {
              kind: "theme",
              themeId: theme.id,
            };
            const key = makeTagKey(location, tag.id as TagId);
            const entry = invoked.get(key);
            const isInvoked = entry !== undefined;
            const isBurnSelected = entry?.burn ?? false;
            const disabled = tag.burned;
            return (
              <TagRow
                key={tag.id}
                label={tag.name}
                tagId={tag.id as TagId}
                location={location}
                tagKind="power"
                polarity="helpful"
                baseValue={1}
                burnValue={3}
                isInvoked={isInvoked}
                isBurnSelected={isBurnSelected}
                disabled={disabled}
                disabledReason={tag.burned ? "Burned — unavailable." : undefined}
                burnable={!tag.scratched || isBurnSelected ? !tag.burned : true}
              />
            );
          })}
          {theme.weaknessTag.name ? (
            (() => {
              const location: TagLocation = {
                kind: "theme",
                themeId: theme.id,
              };
              const key = makeTagKey(location, theme.weaknessTag.id as TagId);
              const isInvoked = invoked.has(key);
              return (
                <TagRow
                  key={`weakness-${theme.id}`}
                  label={theme.weaknessTag.name}
                  tagId={theme.weaknessTag.id as TagId}
                  location={location}
                  tagKind="weakness"
                  polarity="hindering"
                  baseValue={-1}
                  isInvoked={isInvoked}
                  isBurnSelected={false}
                  disabled={false}
                  burnable={false}
                />
              );
            })()
          ) : null}
        </div>
      ))}
      <GroupHeader>Backpack</GroupHeader>
      {character.backpack.storyTags.length === 0 ? (
        <p className="px-3 py-2 text-xs italic text-ink-subtle dark:text-parchment-subtle">
          No story tags.
        </p>
      ) : (
        character.backpack.storyTags.map((tag) => {
          const location: TagLocation = { kind: "backpack" };
          const key = makeTagKey(location, tag.id as TagId);
          const isInvoked = invoked.has(key);
          return (
            <TagRow
              key={tag.id}
              label={tag.name}
              tagId={tag.id as TagId}
              location={location}
              tagKind="story"
              polarity={tag.polarity}
              baseValue={tag.polarity === "helpful" ? 1 : -1}
              isInvoked={isInvoked}
              isBurnSelected={false}
              disabled={tag.scratched}
              disabledReason={tag.scratched ? "Scratched — unavailable." : undefined}
              burnable={false}
            />
          );
        })
      )}
    </div>
  );
}
