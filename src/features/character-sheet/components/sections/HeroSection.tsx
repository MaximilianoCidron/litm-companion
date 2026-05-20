"use client";
import { Card, Skeleton, Track } from "@/shared/ui";
import { useCharacter } from "../CharacterProvider";
import { MomentOfFulfillmentBadge } from "../moment-of-fulfillment-badge";

export function HeroSection() {
  const { character, role } = useCharacter();
  const { identity, progression, fellowship } = character;
  const hasRelationships = fellowship.relationships.length > 0;
  const hasQuintessences = progression.quintessences.length > 0;
  const canEdit = role === "owner" || role === "gm";
  const showMomentOfFulfillment =
    progression.promise === 5 && canEdit;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <Card>
        <Card.Header title="Hero" />
        <Card.Body className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Name
            </span>
            <h2 className="font-display text-2xl tracking-tight text-ink-base dark:text-parchment-base">
              {identity.name || "Unnamed hero"}
            </h2>
            {identity.pronouns ? (
              <span className="text-sm text-ink-muted dark:text-parchment-muted">
                {identity.pronouns}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Concept
            </span>
            <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
              {identity.concept || "—"}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Player
            </span>
            <span className="text-sm text-ink-base dark:text-parchment-base">
              {identity.playerName || "—"}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Companions
            </span>
            {hasRelationships ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted dark:text-parchment-muted">
                    <th className="pb-2 font-medium">Companion</th>
                    <th className="pb-2 font-medium">Relationship</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist-light dark:divide-mist-dark">
                  {fellowship.relationships.map((rel) => (
                    <tr key={rel.id}>
                      <td className="py-3 text-ink-base dark:text-parchment-base">
                        {rel.partnerName}
                      </td>
                      <td className="py-3 font-serif italic text-ink-muted dark:text-parchment-muted">
                        {rel.relationshipTag || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
                No companions yet.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Track total={5} filled={progression.promise} label="Promise" />
            {showMomentOfFulfillment ? (
              <div className="mt-2">
                <MomentOfFulfillmentBadge />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Quintessences
            </span>
            {hasQuintessences ? (
              <ul className="flex flex-col gap-2 text-sm text-ink-base dark:text-parchment-base">
                {progression.quintessences.map((q, i) => (
                  <li key={i} className="font-serif italic">
                    {q}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </ul>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
