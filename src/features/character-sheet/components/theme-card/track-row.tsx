"use client";
import { useCallback, useState, useTransition } from "react";
import { Track, toast } from "@/shared/ui";
import { markTrack } from "../../actions";
import { AdvancementBadge, type AdvancementKind } from "./advancement-badge";
import type { CharacterId, Theme, ThemeId } from "../../schemas";

interface TrackRowProps {
  characterId: CharacterId;
  themeId: ThemeId;
  tracks: Theme["tracks"];
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
  themeId,
  trackKey,
  filled,
  disabled,
}: {
  characterId: CharacterId;
  themeId: ThemeId;
  trackKey: AdvancementKind;
  filled: number;
  disabled: boolean;
}) {
  const [, startTransition] = useTransition();
  const [celebrate, setCelebrate] = useState(false);

  const onChange = useCallback(
    (delta: -1 | 1) => {
      startTransition(async () => {
        const result = await markTrack({
          characterId,
          themeId,
          track: trackKey,
          delta,
        });
        if (!result.ok) {
          toast.error("Couldn't update track", {
            description: result.error.message,
          });
          return;
        }
        if (result.data.advancementAvailable) {
          setCelebrate(true);
          // Auto-clear the one-shot so the badge can celebrate again next time
          // the track refills (badge unmounts in between, so the residual flag
          // would otherwise leak across mount cycles).
          setTimeout(() => setCelebrate(false), 1500);
        }
      });
    },
    [characterId, themeId, trackKey],
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
          themeId={themeId}
          disabled={disabled}
          celebrate={celebrate}
        />
      ) : null}
    </div>
  );
}

export function TrackRow({
  characterId,
  themeId,
  tracks,
  disabled = false,
}: TrackRowProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {TRACKS.map((key) => (
        <TrackCell
          key={key}
          characterId={characterId}
          themeId={themeId}
          trackKey={key}
          filled={tracks[key]}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
