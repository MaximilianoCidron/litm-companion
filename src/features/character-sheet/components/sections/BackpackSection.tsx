"use client";
import { Card, TagPill } from "@/shared/ui";
import { useCharacter } from "../CharacterProvider";

export function BackpackSection() {
  const { character } = useCharacter();
  const { storyTags, notes } = character.backpack;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      <Card>
        <Card.Header title="Backpack" />
        <Card.Body>
          {storyTags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {storyTags.map((tag) => (
                <li key={tag.id}>
                  <TagPill
                    polarity={
                      tag.polarity === "helpful"
                        ? "story-helpful"
                        : "story-hindering"
                    }
                    label={tag.name}
                    state={tag.scratched ? "scratched" : "active"}
                  />
                </li>
              ))}
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
            <div className="prose text-base text-ink-base dark:text-parchment-base whitespace-pre-wrap">
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
