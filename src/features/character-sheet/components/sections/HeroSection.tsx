import { Card, Skeleton, Track } from "@/shared/ui";
import type { Character } from "../../schemas";

export function HeroSection({ character }: { character: Character }) {
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
              {character.name}
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Player
            </span>
            <Skeleton className="h-4 w-40" />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Companions
            </span>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-muted dark:text-parchment-muted">
                  <th className="pb-2 font-medium">Companion</th>
                  <th className="pb-2 font-medium">Relationship</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist-light dark:divide-mist-dark">
                {Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="py-3">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="py-3">
                      <Skeleton className="h-4 w-40" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <Track total={5} filled={character.promise} label="Promise" />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Quintessences
            </span>
            <ul className="flex flex-col gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </ul>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
