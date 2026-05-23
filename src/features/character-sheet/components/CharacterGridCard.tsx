import Link from "next/link";
import { Archive } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, Card, Track } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { CharacterSummary } from "../schemas";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function CharacterGridCard({ char }: { char: CharacterSummary }) {
  const isRetired = char.status === "retired";
  return (
    <Link
      href={`/characters/${char.id}`}
      title={isRetired ? "Archived hero" : undefined}
      className={cn(
        "block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 focus-visible:ring-offset-parchment dark:focus-visible:ring-offset-ink",
        isRetired && "opacity-70",
      )}
    >
      <Card variant="interactive">
        <Card.Header>
          <h3 className="flex flex-1 items-center gap-2 truncate font-display text-lg tracking-tight">
            {char.name}
            {isRetired ? (
              <Archive
                className="h-4 w-4 text-parchment-elevated/80"
                aria-label="Archived"
              />
            ) : null}
          </h3>
        </Card.Header>
        <Card.Body className="flex flex-col gap-4">
          <div className="flex items-start gap-4">
            <Avatar size="lg">
              {char.avatarUrl ? (
                <AvatarImage src={char.avatarUrl} alt={`${char.name} portrait`} />
              ) : null}
              <AvatarFallback>{initials(char.name)}</AvatarFallback>
            </Avatar>
            <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
              {char.concept}
            </p>
          </div>
          <p className="text-sm text-ink-subtle dark:text-parchment-subtle">
            {char.campaignName}
          </p>
        </Card.Body>
        <Card.Footer>
          <Track total={5} filled={char.promise} label="Promise" />
        </Card.Footer>
      </Card>
    </Link>
  );
}
