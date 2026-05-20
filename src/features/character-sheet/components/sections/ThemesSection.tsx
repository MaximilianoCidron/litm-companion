"use client";
import { Card, TagPill, Track } from "@/shared/ui";
import { useCharacter } from "../CharacterProvider";
import type { PowerTag, Theme } from "../../schemas";

function typeLabel(type: Theme["type"]): string {
  const [, name] = type.split(":");
  return (name ?? type).replace(/_/g, " ");
}

function ThemeCard({ theme }: { theme: Theme }) {
  return (
    <Card>
      <Card.Header
        title={`${theme.name || "Untitled theme"} · ${typeLabel(theme.type)}`}
      />
      <Card.Body className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Might
          </span>
          <span className="font-display text-sm capitalize text-ink-base dark:text-parchment-base">
            {theme.mightLevel}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Power tags
          </span>
          {theme.powerTags.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {theme.powerTags.map((tag: PowerTag) => (
                <li key={tag.id}>
                  <TagPill
                    polarity="power"
                    label={tag.name}
                    state={
                      tag.burned
                        ? "burned"
                        : tag.scratched
                          ? "scratched"
                          : "active"
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
              None yet.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Weakness
          </span>
          {theme.weaknessTag.name ? (
            <TagPill polarity="weakness" label={theme.weaknessTag.name} />
          ) : (
            <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
              Not chosen.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
            Quest
          </span>
          <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
            {theme.quest || "—"}
          </p>
        </div>
      </Card.Body>
      <Card.Footer className="flex-col items-stretch gap-2">
        <Track total={3} filled={theme.tracks.abandon} label="Abandon" />
        <Track total={3} filled={theme.tracks.improve} label="Improve" />
        <Track total={3} filled={theme.tracks.milestone} label="Milestone" />
      </Card.Footer>
    </Card>
  );
}

export function ThemesSection() {
  const { character } = useCharacter();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
      {character.themes.map((theme) => (
        <ThemeCard key={theme.id} theme={theme} />
      ))}
    </div>
  );
}
