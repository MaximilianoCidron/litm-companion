import { Card, Skeleton, Track } from "@/shared/ui";

interface ThemeCardPlaceholderProps {
  title?: string;
  type?: string;
}

export function ThemeCardPlaceholder({
  title = "Theme",
  type = "Origin",
}: ThemeCardPlaceholderProps) {
  return (
    <Card>
      <Card.Header title={`${title} · ${type}`} />
      <Card.Body className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Type
          </span>
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Tags
          </span>
          <ul className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="flex items-center gap-2 border-b border-dashed border-mist-light/60 pb-2 dark:border-mist-dark/60"
              >
                <Skeleton className="h-3 w-3 rounded-full" />
                <Skeleton className="h-3 flex-1" />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Status
          </span>
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Quest
          </span>
          <Skeleton className="h-12 w-full" />
        </div>
      </Card.Body>
      <Card.Footer className="flex-col items-stretch gap-2">
        <Track total={3} filled={0} label="Abandon" />
        <Track total={3} filled={0} label="Improve" />
        <Track total={3} filled={0} label="Milestone" />
      </Card.Footer>
    </Card>
  );
}
