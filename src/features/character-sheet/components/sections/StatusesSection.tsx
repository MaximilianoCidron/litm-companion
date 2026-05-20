"use client";
import { Card, StatusTierBar, type StatusTier } from "@/shared/ui";
import { useCharacter } from "../CharacterProvider";

export function StatusesSection() {
  const { character } = useCharacter();
  const statuses = character.statuses;
  const helpful = statuses.filter((s) => s.polarity === "helpful");
  const hindering = statuses.filter((s) => s.polarity === "hindering");

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <Card.Header title="Helpful statuses" />
        <Card.Body className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {helpful.length > 0 ? (
            helpful.map((s) => (
              <StatusTierBar
                key={s.id}
                label={s.name}
                tier={s.tier as StatusTier}
                polarity="helpful"
              />
            ))
          ) : (
            <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle md:col-span-2 lg:col-span-3">
              No helpful statuses.
            </p>
          )}
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Hindering statuses" />
        <Card.Body className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hindering.length > 0 ? (
            hindering.map((s) => (
              <StatusTierBar
                key={s.id}
                label={s.name}
                tier={s.tier as StatusTier}
                polarity="hindering"
              />
            ))
          ) : (
            <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle md:col-span-2 lg:col-span-3">
              No hindering statuses.
            </p>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
