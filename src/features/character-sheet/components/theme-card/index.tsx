"use client";
import { useCallback } from "react";
import { Card, EditableField, Separator } from "@/shared/ui";
import { updateTheme } from "../../actions";
import { formatThemeType, type CharacterId, type Theme } from "../../schemas";
import { TypeSelector } from "./type-selector";
import { PowerTagList } from "./power-tag-list";
import { WeaknessTagRow } from "./weakness-tag-row";
import { TrackRow } from "./track-row";
import { SpecialImprovementsList } from "./special-improvements-list";

interface ThemeCardProps {
  theme: Theme;
  characterId: CharacterId;
  canEdit: boolean;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
      {children}
    </span>
  );
}

export function ThemeCard({ theme, characterId, canEdit }: ThemeCardProps) {
  const { mightLabel } = formatThemeType(theme.type);

  const onRenameTheme = useCallback(
    (name: string) =>
      updateTheme({
        characterId,
        themeId: theme.id,
        patch: { kind: "rename", name },
      }),
    [characterId, theme.id],
  );

  const onRetypeTheme = useCallback(
    (type: Theme["type"]) => {
      void updateTheme({
        characterId,
        themeId: theme.id,
        patch: { kind: "retype", type },
      });
    },
    [characterId, theme.id],
  );

  const onSetQuest = useCallback(
    (quest: string) =>
      updateTheme({
        characterId,
        themeId: theme.id,
        patch: { kind: "setQuest", quest },
      }),
    [characterId, theme.id],
  );

  return (
    <Card>
      <Card.Header>
        <div className="flex w-full items-center justify-between gap-2">
          {canEdit ? (
            <TypeSelector value={theme.type} onChange={onRetypeTheme} />
          ) : (
            <span className="font-display text-sm text-parchment-elevated">
              {formatThemeType(theme.type).label}
            </span>
          )}
          <span className="text-xs uppercase tracking-wider text-parchment-muted">
            Might · {mightLabel}
          </span>
        </div>
      </Card.Header>

      <Card.Body className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <SectionHeading>Name</SectionHeading>
          <EditableField
            value={theme.name}
            onCommit={onRenameTheme}
            placeholder="Name this theme…"
            ariaLabel="Theme name"
            maxLength={60}
            fontPreset="display"
            disabled={!canEdit}
            className="text-lg tracking-tight"
          />
        </div>

        <div className="flex flex-col gap-2">
          <SectionHeading>Power tags</SectionHeading>
          <PowerTagList
            characterId={characterId}
            themeId={theme.id}
            tags={theme.powerTags}
            disabled={!canEdit}
          />
        </div>

        <div className="flex flex-col gap-2">
          <SectionHeading>Weakness</SectionHeading>
          <WeaknessTagRow
            characterId={characterId}
            themeId={theme.id}
            weaknessTag={theme.weaknessTag}
            disabled={!canEdit}
          />
        </div>

        <div className="flex flex-col gap-2">
          <SectionHeading>Quest</SectionHeading>
          <EditableField
            value={theme.quest}
            onCommit={onSetQuest}
            placeholder="What does this theme demand of you?"
            ariaLabel="Theme quest"
            maxLength={200}
            multiline
            fontPreset="prose"
            disabled={!canEdit}
            className="italic"
          />
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <SectionHeading>Tracks</SectionHeading>
          <TrackRow
            characterId={characterId}
            themeId={theme.id}
            tracks={theme.tracks}
            disabled={!canEdit}
          />
        </div>

        <Separator />

        <div className="flex flex-col gap-2">
          <SectionHeading>Special improvements</SectionHeading>
          <SpecialImprovementsList
            characterId={characterId}
            themeId={theme.id}
            improvements={theme.specialImprovements}
            disabled={!canEdit}
          />
        </div>
      </Card.Body>
    </Card>
  );
}
