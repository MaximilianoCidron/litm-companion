"use client";
import { useCallback } from "react";
import { Card, EditableField, TagPill } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import {
  removeStoryTag,
  updateBackpackNotes,
  updateTag,
} from "../../actions";
import { useCharacter } from "../CharacterProvider";
import { AddStoryTagForm } from "../backpack/add-story-tag-form";
import type { CharacterId, TagId } from "../../schemas";

export function BackpackSection() {
  const { character, role } = useCharacter();
  const callAction = useActionWithToast();
  const canEdit = role === "owner" || role === "gm";
  const { storyTags, notes } = character.backpack;

  const characterId: CharacterId = character.id;

  const saveNotes = useCallback(
    (next: string) =>
      updateBackpackNotes({ characterId, notes: next }),
    [characterId],
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      <Card>
        <Card.Header title="Story tags" />
        <Card.Body>
          <div className="flex flex-col gap-4">
            {storyTags.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {storyTags.map((tag) => {
                  const tagIdBranded = tag.id as TagId;
                  const onToggleScratch = canEdit
                    ? async () => {
                        await callAction(
                          updateTag({
                            characterId,
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
                            characterId,
                            location: { kind: "backpack", tagId: tagIdBranded },
                            patch: { kind: "rename", name: newName },
                          }),
                        );
                      }
                    : undefined;
                  const onRemove = canEdit
                    ? async () => {
                        await callAction(
                          removeStoryTag({
                            characterId,
                            tagId: tagIdBranded,
                          }),
                          { onSuccess: "Story tag removed" },
                        );
                      }
                    : undefined;
                  const onTogglePreserve = canEdit
                    ? async () => {
                        await callAction(
                          updateTag({
                            characterId,
                            location: { kind: "backpack", tagId: tagIdBranded },
                            patch: {
                              kind: "setPreserved",
                              preserved: !tag.preserved,
                            },
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
                        isPreserved={tag.preserved}
                        onToggleScratch={onToggleScratch}
                        onRename={onRename}
                        onRemove={onRemove}
                        onTogglePreserve={onTogglePreserve}
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
            {canEdit ? <AddStoryTagForm characterId={characterId} /> : null}
          </div>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Notes" />
        <Card.Body>
          {canEdit ? (
            <EditableField
              multiline
              value={notes}
              onCommit={saveNotes}
              placeholder="Clues, lore, reminders…"
              ariaLabel="Backpack notes"
              maxLength={2000}
              fontPreset="prose"
            />
          ) : notes ? (
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
