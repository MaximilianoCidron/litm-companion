"use client";

import { Lock, Unlock } from "lucide-react";
import { Button } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { updateTag } from "../../actions";
import type { CharacterId, StoryTag, TagId } from "../../schemas";

interface StoryTagPreservationListProps {
  characterId: CharacterId;
  storyTags: readonly StoryTag[];
}

export function StoryTagPreservationList({
  characterId,
  storyTags,
}: StoryTagPreservationListProps) {
  const callAction = useActionWithToast();

  if (storyTags.length === 0) return null;

  const discarded = storyTags.filter((t) => !t.preserved);
  const preserved = storyTags.filter((t) => t.preserved);

  const toggle = (tag: StoryTag) =>
    callAction(
      updateTag({
        characterId,
        location: { kind: "backpack", tagId: tag.id as TagId },
        patch: { kind: "setPreserved", preserved: !tag.preserved },
      }),
    );

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-ink-subtle dark:text-parchment-subtle">
        Tags marked for preservation survive camp. All others — including
        single-use ones you&apos;ve already used — are discarded.
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PreservationColumn
          heading="Will be discarded"
          empty="Nothing to discard."
          tags={discarded}
          actionLabel="Preserve"
          ActionIcon={Lock}
          onToggle={toggle}
        />
        <PreservationColumn
          heading="Preserved"
          empty="No tags preserved."
          tags={preserved}
          actionLabel="Discard"
          ActionIcon={Unlock}
          onToggle={toggle}
        />
      </div>
    </div>
  );
}

interface ColumnProps {
  heading: string;
  empty: string;
  tags: StoryTag[];
  actionLabel: string;
  ActionIcon: typeof Lock;
  onToggle: (tag: StoryTag) => Promise<unknown>;
}

function PreservationColumn({
  heading,
  empty,
  tags,
  actionLabel,
  ActionIcon,
  onToggle,
}: ColumnProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-mist-light bg-parchment-elevated p-3 dark:border-mist-dark dark:bg-ink-elevated">
      <h4 className="font-display text-sm uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        {heading}
      </h4>
      {tags.length === 0 ? (
        <p className="text-xs italic text-ink-subtle dark:text-parchment-subtle">
          {empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-sm text-ink-base dark:text-parchment-base">
                {tag.name}
                {tag.scratched ? (
                  <span className="ml-2 text-xs italic text-ink-subtle dark:text-parchment-subtle">
                    (used)
                  </span>
                ) : null}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => void onToggle(tag)}
              >
                <ActionIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {actionLabel}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
