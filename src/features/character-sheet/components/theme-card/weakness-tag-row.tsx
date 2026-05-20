"use client";
import { useCallback } from "react";
import { EditableField } from "@/shared/ui";
import { updateTag } from "../../actions";
import type {
  CharacterId,
  TagId,
  ThemeId,
  WeaknessTag,
} from "../../schemas";

interface WeaknessTagRowProps {
  characterId: CharacterId;
  themeId: ThemeId;
  weaknessTag: WeaknessTag;
  disabled?: boolean;
}

export function WeaknessTagRow({
  characterId,
  themeId,
  weaknessTag,
  disabled,
}: WeaknessTagRowProps) {
  const onCommit = useCallback(
    (name: string) =>
      updateTag({
        characterId,
        location: {
          kind: "theme",
          themeId,
          tagId: weaknessTag.id as TagId,
        },
        patch: { kind: "rename", name },
      }),
    [characterId, themeId, weaknessTag.id],
  );

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="h-3 w-3 shrink-0 rounded-full bg-tag-weakness-base"
      />
      <EditableField
        value={weaknessTag.name}
        onCommit={onCommit}
        placeholder="Name the weakness…"
        ariaLabel="Weakness tag name"
        maxLength={60}
        disabled={disabled}
        className="text-sm"
      />
    </div>
  );
}
