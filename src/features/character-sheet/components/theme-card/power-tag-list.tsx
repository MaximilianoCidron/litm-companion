"use client";
import { useTransition } from "react";
import { X } from "lucide-react";
import { TagPill, toast } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import { removePowerTag } from "../../actions";
import { PowerTagAdder } from "./power-tag-adder";
import type {
  CharacterId,
  PowerTag,
  TagId,
  ThemeId,
} from "../../schemas";

interface PowerTagListProps {
  characterId: CharacterId;
  themeId: ThemeId;
  tags: PowerTag[];
  disabled?: boolean;
}

function tagState(tag: PowerTag): "active" | "scratched" | "burned" {
  if (tag.burned) return "burned";
  if (tag.scratched) return "scratched";
  return "active";
}

function PowerTagRow({
  tag,
  characterId,
  themeId,
  disabled,
}: {
  tag: PowerTag;
  characterId: CharacterId;
  themeId: ThemeId;
  disabled: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const onRemove = () => {
    startTransition(async () => {
      const result = await removePowerTag({
        characterId,
        themeId,
        tagId: tag.id as TagId,
      });
      if (!result.ok) {
        toast.error("Couldn't remove tag", {
          description: result.error.message,
        });
      }
    });
  };

  return (
    <div className="group relative inline-flex items-center">
      {/* TODO(prompt-4): wire toggle and burn on pill click */}
      <TagPill polarity="power" label={tag.name} state={tagState(tag)} />
      {!disabled ? (
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          aria-label={`Remove ${tag.name}`}
          className={cn(
            "absolute -right-1 -top-1 hidden h-5 w-5 items-center justify-center rounded-full",
            "bg-crimson text-parchment-elevated shadow-sm",
            "group-hover:flex group-focus-within:flex",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
            "disabled:opacity-50",
          )}
        >
          <X className="h-3 w-3" aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

export function PowerTagList({
  characterId,
  themeId,
  tags,
  disabled = false,
}: PowerTagListProps) {
  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap gap-2">
        {tags.length === 0 ? (
          <li className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
            None yet.
          </li>
        ) : (
          tags.map((tag) => (
            <li key={tag.id}>
              <PowerTagRow
                tag={tag}
                characterId={characterId}
                themeId={themeId}
                disabled={disabled}
              />
            </li>
          ))
        )}
      </ul>
      {!disabled ? (
        <PowerTagAdder
          characterId={characterId}
          themeId={themeId}
          currentCount={tags.length}
        />
      ) : null}
    </div>
  );
}
