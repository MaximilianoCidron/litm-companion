"use client";
import { Card } from "@/shared/ui";
import { useCharacter } from "../CharacterProvider";

export function FellowshipSection() {
  const { character } = useCharacter();
  const relationships = character.fellowship.relationships;
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr] lg:gap-6">
      <Card>
        <Card.Header title="Fellowship" />
        <Card.Body className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Companions
            </span>
            {relationships.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted dark:text-parchment-muted">
                    <th className="pb-2 font-medium">Companion</th>
                    <th className="pb-2 font-medium">Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist-light dark:divide-mist-dark">
                  {relationships.map((rel) => (
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
        </Card.Body>
      </Card>

      <Card variant="inset">
        <Card.Header title="Fellowship Theme" />
        <Card.Body>
          <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
            Fellowship theme syncs from your campaign (coming soon).
          </p>
        </Card.Body>
      </Card>
    </div>
  );
}
