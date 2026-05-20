"use client";
import { Card, TagPill } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { updateTag } from "../../actions";
import { useCharacter } from "../CharacterProvider";
import type { TagId } from "../../schemas";

// TODO(prompt-7): add/remove story tags + editable notes.
export function BackpackSection() {
  const { character, role } = useCharacter();
  const callAction = useActionWithToast();
  const canEdit = role === "owner" || role === "gm";
  const { storyTags, notes } = character.backpack;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      <Card>
        <Card.Header title="Story tags" />
        <Card.Body>
          {storyTags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {storyTags.map((tag) => {
                const tagIdBranded = tag.id as TagId;
                const onToggleScratch = canEdit
                  ? async () => {
                      await callAction(
                        updateTag({
                          characterId: character.id,
                          location: { kind: "backpack", tagId: tagIdBranded },
                          patch: {
                            kind: "scratch",
                            scratched: !tag.scratched,
                          },
                        }),
                      );
                    }
                  : undefined;
                const onRename = canEdit
                  ? async (newName: string) => {
                      await callAction(
                        updateTag({
                          characterId: character.id,
                          location: { kind: "backpack", tagId: tagIdBranded },
                          patch: { kind: "rename", name: newName },
                        }),
                      );
                    }
                  : undefined;
                return (
                  <li key={tag.id}>
                    <TagPill
                      polarity={
                        tag.polarity === "helpful"
                          ? "story-helpful"
                          : "story-hindering"
                      }
                      label={tag.name}
                      state={tag.scratched ? "scratched" : "active"}
                      onToggleScratch={onToggleScratch}
                      onRename={onRename}
                    />
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
              No story tags yet.
            </p>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Notes" />
        <Card.Body>
          {notes ? (
            <div className="prose whitespace-pre-wrap text-base text-ink-base dark:text-parchment-base">
              {notes}
            </div>
          ) : (
            <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
              No notes.
            </p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
