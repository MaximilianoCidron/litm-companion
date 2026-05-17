import { Card, Skeleton } from "@/shared/ui";

export function BackpackSection() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
      <Card>
        <Card.Header title="Backpack" />
        <Card.Body>
          <ul className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-2 border-b border-dashed border-mist-light/60 pb-2 dark:border-mist-dark/60"
              >
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 flex-1" />
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>

      <Card>
        <Card.Header title="Notes" />
        <Card.Body>
          <div className="prose text-base text-ink-base dark:text-parchment-base">
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-5/6" />
            <Skeleton className="mb-2 h-4 w-4/6" />
            <Skeleton className="mb-2 h-4 w-3/4" />
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
