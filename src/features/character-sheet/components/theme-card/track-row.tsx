"use client";
import { useCallback, useTransition } from "react";
import { Track, toast } from "@/shared/ui";
import { markTrack } from "../../actions";
import { AdvancementBadge, type AdvancementKind } from "./advancement-badge";
import type { CharacterId, Theme } from "../../schemas";

interface TrackRowProps {
  characterId: CharacterId;
  theme: Theme;
  disabled?: boolean;
}

const TRACKS: AdvancementKind[] = ["improve", "milestone", "abandon"];

const LABEL: Record<AdvancementKind, string> = {
  improve: "Improve",
  milestone: "Milestone",
  abandon: "Abandon",
};

function TrackCell({
  characterId,
  theme,
  trackKey,
  filled,
  disabled,
}: {
  characterId: CharacterId;
  theme: Theme;
  trackKey: AdvancementKind;
  filled: number;
  disabled: boolean;
}) {
  const [, startTransition] = useTransition();

  const onChange = useCallback(
    (delta: -1 | 1) => {
      startTransition(async () => {
        const result = await markTrack({
          characterId,
          themeId: theme.id,
          track: trackKey,
          delta,
        });
        if (!result.ok) {
          toast.error("Couldn't update track", {
            description: result.error.message,
          });
        }
      });
    },
    [characterId, theme.id, trackKey],
  );

  return (
    <div className="flex flex-col gap-2">
      <Track
        total={3}
        filled={filled}
        label={LABEL[trackKey]}
        onChange={disabled ? undefined : onChange}
        disabled={disabled}
      />
      {filled === 3 ? (
        <AdvancementBadge
          kind={trackKey}
          theme={theme}
          characterId={characterId}
          disabled={disabled}
        />
      ) : null}
    </div>
  );
}

export function TrackRow({
  characterId,
  theme,
  disabled = false,
}: TrackRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {TRACKS.map((key) => (
        <TrackCell
          key={key}
          characterId={characterId}
          theme={theme}
          trackKey={key}
          filled={theme.tracks[key]}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
