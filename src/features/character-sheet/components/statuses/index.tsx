"use client";
import { useCharacter } from "../CharacterProvider";
import { AddStatusForm } from "./add-status-form";
import { StatusEditor } from "./status-editor";

export function StatusManager() {
  const { character, canEdit } = useCharacter();

  const helpful = character.statuses.filter((s) => s.polarity === "helpful");
  const hindering = character.statuses.filter(
    (s) => s.polarity === "hindering",
  );

  return (
    <div className="flex flex-col gap-8">
      <section>
        <h3 className="mb-3 font-display text-xs uppercase tracking-wider text-moss-text dark:text-moss-text-dark">
          Helpful
        </h3>
        {helpful.length === 0 ? (
          <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
            No helpful statuses.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {helpful.map((s) => (
              <li key={s.id}>
                <StatusEditor
                  status={s}
                  characterId={character.id}
                  canEdit={canEdit}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="mb-3 font-display text-xs uppercase tracking-wider text-rust-text dark:text-rust-text-dark">
          Hindering
        </h3>
        {hindering.length === 0 ? (
          <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
            No hindering statuses.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {hindering.map((s) => (
              <li key={s.id}>
                <StatusEditor
                  status={s}
                  characterId={character.id}
                  canEdit={canEdit}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {canEdit ? <AddStatusForm characterId={character.id} /> : null}
    </div>
  );
}
