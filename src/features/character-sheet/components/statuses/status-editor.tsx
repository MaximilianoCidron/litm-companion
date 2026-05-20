"use client";
import { useCallback } from "react";
import { Trash2 } from "lucide-react";
import {
  Button,
  EditableField,
  StatusTierBar,
  type StatusTier,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { applyStatus } from "../../actions";
import type { CharacterId, Status, StatusId } from "../../schemas";

interface StatusEditorProps {
  status: Status;
  characterId: CharacterId;
  canEdit: boolean;
}

export function StatusEditor({
  status,
  characterId,
  canEdit,
}: StatusEditorProps) {
  const callAction = useActionWithToast();
  const statusIdBranded = status.id as StatusId;

  const onRename = useCallback(
    (name: string) =>
      applyStatus({
        characterId,
        status: { kind: "rename", statusId: statusIdBranded, name },
      }),
    [characterId, statusIdBranded],
  );

  const onTier = useCallback(
    (next: StatusTier) => {
      void callAction(
        applyStatus({
          characterId,
          status: { kind: "setTier", statusId: statusIdBranded, tier: next },
        }),
      );
    },
    [callAction, characterId, statusIdBranded],
  );

  const onClear = useCallback(() => {
    void callAction(
      applyStatus({
        characterId,
        status: { kind: "clear", statusId: statusIdBranded },
      }),
    );
  }, [callAction, characterId, statusIdBranded]);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-mist-light bg-parchment-elevated p-3 dark:border-mist-dark dark:bg-ink-elevated md:flex-row md:items-end">
      <div className="flex-1">
        <EditableField
          value={status.name}
          onCommit={onRename}
          ariaLabel="Status name"
          maxLength={40}
          fontPreset="display"
          disabled={!canEdit}
          className="text-base"
        />
      </div>
      <div className="flex-1">
        <StatusTierBar
          tier={status.tier as StatusTier}
          polarity={status.polarity}
          label={status.name || "Status"}
          onChange={canEdit ? onTier : undefined}
        />
      </div>
      {canEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Clear status ${status.name}`}
          onClick={onClear}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  );
}
