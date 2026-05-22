"use client";
import { TagPill } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import {
  addPowerTag,
  burnTag,
  removePowerTag,
  updateTag,
} from "../../actions";
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

export function PowerTagList({
  characterId,
  themeId,
  tags,
  disabled = false,
}: PowerTagListProps) {
  const callAction = useActionWithToast();

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-wrap items-center gap-2">
        {tags.length === 0 ? (
          <li className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
            None yet.
          </li>
        ) : (
          tags.map((tag) => {
            const tagIdBranded = tag.id as TagId;
            const onToggleScratch =
              disabled || tag.burned
                ? undefined
                : async () => {
                    await callAction(
                      updateTag({
                        characterId,
                        location: {
                          kind: "theme",
                          themeId,
                          tagId: tagIdBranded,
                        },
                        patch: { kind: "scratch", scratched: !tag.scratched },
                      }),
                    );
                  };
            const onBurn =
              disabled || tag.burned
                ? undefined
                : async () => {
                    await callAction(
                      burnTag({
                        characterId,
                        themeId,
                        tagId: tagIdBranded,
                      }),
                    );
                  };
            const onRename = disabled
              ? undefined
              : async (newName: string) => {
                  await callAction(
                    updateTag({
                      characterId,
                      location: {
                        kind: "theme",
                        themeId,
                        tagId: tagIdBranded,
                      },
                      patch: { kind: "rename", name: newName },
                    }),
                  );
                };
            const onRemove = disabled
              ? undefined
              : async () => {
                  await callAction(
                    removePowerTag({
                      characterId,
                      themeId,
                      tagId: tagIdBranded,
                    }),
                  );
                };
            return (
              <li key={tag.id}>
                <TagPill
                  polarity="power"
                  label={tag.name}
                  state={tagState(tag)}
                  onToggleScratch={onToggleScratch}
                  onBurn={onBurn}
                  onRename={onRename}
                  onRemove={onRemove}
                  disabled={disabled}
                />
              </li>
            );
          })
        )}
      </ul>
      {!disabled ? (
        <PowerTagAdder
          onAdd={(name) => addPowerTag({ characterId, themeId, name })}
          currentCount={tags.length}
        />
      ) : null}
    </div>
  );
}
