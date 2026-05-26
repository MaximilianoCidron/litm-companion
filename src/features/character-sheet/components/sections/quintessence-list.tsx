"use client";
import { TagPill } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { updateTag } from "../../actions";
import { useCharacter } from "../CharacterProvider";

/**
 * Quintessence display + interactive scratch/rename. Acquired only via the
 * `gainQuintessence` Moment of Fulfillment path — no manual add affordance.
 * Burn + preserve are intentionally omitted (quintessences are permanent and
 * never single-use story-tag-style).
 */
export function QuintessenceList() {
  const { character, role, isRetired } = useCharacter();
  const canEdit = role === "owner" && !isRetired;
  const callAction = useActionWithToast();

  if (character.quintessences.length === 0) {
    return (
      <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
        No quintessences yet. Earned through Moments of Fulfillment.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {character.quintessences.map((q) => (
        <TagPill
          key={q.id}
          polarity="quintessence"
          label={q.name}
          state={q.scratched ? "scratched" : "active"}
          onToggleScratch={
            canEdit
              ? async () => {
                  await callAction(
                    updateTag({
                      characterId: character.id,
                      location: {
                        kind: "quintessence",
                        quintessenceId: q.id,
                      },
                      patch: { kind: "scratch", scratched: !q.scratched },
                    }),
                  );
                }
              : undefined
          }
          onRename={
            canEdit
              ? async (newName) => {
                  await callAction(
                    updateTag({
                      characterId: character.id,
                      location: {
                        kind: "quintessence",
                        quintessenceId: q.id,
                      },
                      patch: { kind: "rename", name: newName },
                    }),
                    { onSuccess: "Quintessence renamed" },
                  );
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}
