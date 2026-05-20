"use client";
import type { CharacterId, Theme } from "../../schemas";
import { ImprovementDialog } from "./advancement-dialogs/improvement-dialog";
import { EvolveDialog } from "./advancement-dialogs/evolve-dialog";
import { ReplaceDialog } from "./advancement-dialogs/replace-dialog";

export type AdvancementKind = "improve" | "milestone" | "abandon";

interface AdvancementBadgeProps {
  kind: AdvancementKind;
  theme: Theme;
  characterId: CharacterId;
  disabled?: boolean;
}

export function AdvancementBadge({
  kind,
  theme,
  characterId,
  disabled,
}: AdvancementBadgeProps) {
  if (kind === "improve") {
    return (
      <ImprovementDialog
        theme={theme}
        characterId={characterId}
        disabled={disabled}
      />
    );
  }
  if (kind === "milestone") {
    return (
      <EvolveDialog
        theme={theme}
        characterId={characterId}
        disabled={disabled}
      />
    );
  }
  return (
    <ReplaceDialog
      theme={theme}
      characterId={characterId}
      disabled={disabled}
    />
  );
}
