"use client";
import { useState } from "react";
import { Pencil, X } from "lucide-react";
import {
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { cn } from "@/shared/lib/cn";
import { mutateRelationships } from "../../actions";
import {
  type CampaignRosterEntry,
  type Character,
  type FellowshipRelationship,
} from "../../schemas";
import { AddRelationshipForm } from "./add-relationship-form";

interface RelationshipManagerProps {
  character: Character;
  roster: readonly CampaignRosterEntry[];
  canEdit: boolean;
}

export function RelationshipManager({
  character,
  roster,
  canEdit,
}: RelationshipManagerProps) {
  const callAction = useActionWithToast();
  const relationships = character.fellowship.relationships;
  const [editing, setEditing] = useState<FellowshipRelationship | null>(null);

  return (
    <Card>
      <Card.Header title="Relationships" />
      <Card.Body className="flex flex-col gap-4">
        {relationships.length === 0 ? (
          <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
            No relationships yet.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-mist-light dark:divide-mist-dark">
            {relationships.map((rel) => (
              <li
                key={rel.id}
                className="flex items-center gap-3 py-2"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "inline-block h-3 w-3 shrink-0 rounded-full",
                    rel.polarity === "helpful"
                      ? "bg-tag-power-base"
                      : "bg-tag-weakness-base",
                  )}
                />
                <div className="flex flex-1 flex-col">
                  <span className="font-serif text-ink-base dark:text-parchment-base">
                    {rel.companionName}
                  </span>
                  <span className="font-serif text-sm italic text-ink-muted dark:text-parchment-muted">
                    {rel.relationshipTag}
                  </span>
                </div>
                {canEdit ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label={`Edit ${rel.companionName}`}
                      onClick={() => setEditing(rel)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded text-ink-muted hover:bg-parchment-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:text-parchment-muted dark:hover:bg-ink-elevated"
                    >
                      <Pencil className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <ConfirmDialog
                      trigger={
                        <button
                          type="button"
                          aria-label={`Remove ${rel.companionName}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded text-ink-muted hover:bg-parchment-elevated hover:text-crimson focus:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:text-parchment-muted dark:hover:bg-ink-elevated"
                        >
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      }
                      title="Remove this relationship?"
                      description={
                        <>
                          <strong>
                            {rel.companionName} · {rel.relationshipTag}
                          </strong>{" "}
                          will be removed.
                        </>
                      }
                      confirmLabel="Remove"
                      variant="destructive"
                      onConfirm={async () => {
                        await callAction(
                          mutateRelationships({
                            characterId: character.id,
                            op: {
                              kind: "remove",
                              relationshipId: rel.id,
                            },
                          }),
                          { onSuccess: "Relationship removed" },
                        );
                      }}
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {canEdit ? (
          <AddRelationshipForm
            characterId={character.id}
            roster={roster}
            selfCharacterId={character.id}
          />
        ) : null}
      </Card.Body>

      {editing ? (
        <EditRelationshipDialog
          relationship={editing}
          characterId={character.id}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </Card>
  );
}

interface EditRelationshipDialogProps {
  relationship: FellowshipRelationship;
  characterId: Character["id"];
  onClose: () => void;
}

function EditRelationshipDialog({
  relationship,
  characterId,
  onClose,
}: EditRelationshipDialogProps) {
  const callAction = useActionWithToast();
  const [tag, setTag] = useState(relationship.relationshipTag);
  const [polarity, setPolarity] = useState(relationship.polarity);
  const [pending, setPending] = useState(false);

  const submit = async () => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    setPending(true);
    const result = await callAction(
      mutateRelationships({
        characterId,
        op: {
          kind: "update",
          relationshipId: relationship.id,
          relationshipTag: trimmed,
          polarity,
        },
      }),
      { onSuccess: "Relationship updated" },
    );
    setPending(false);
    if (result) onClose();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit relationship</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <p className="font-serif text-sm text-ink-muted dark:text-parchment-muted">
            With <strong>{relationship.companionName}</strong>
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Relationship
            </span>
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.currentTarget.value)}
              maxLength={60}
              disabled={pending}
              className="border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm text-ink-base focus:border-ember focus:outline-none dark:border-mist-dark dark:text-parchment-base"
            />
          </label>
          <div className="flex flex-col gap-1 text-sm" role="group" aria-label="Polarity">
            <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Polarity
            </span>
            <div className="flex gap-1">
              {(["helpful", "hindering"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPolarity(p)}
                  aria-pressed={polarity === p}
                  disabled={pending}
                  className={cn(
                    "h-10 rounded px-3 text-sm font-medium capitalize transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                    polarity === p
                      ? p === "helpful"
                        ? "bg-tag-power-soft text-tag-power-text dark:bg-tag-power-soft-dark dark:text-tag-power-text-dark"
                        : "bg-tag-weakness-soft text-tag-weakness-text dark:bg-tag-weakness-soft-dark dark:text-tag-weakness-text-dark"
                      : "text-ink-muted hover:bg-parchment-elevated dark:text-parchment-muted dark:hover:bg-ink-elevated",
                  )}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" disabled={pending} onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={pending || tag.trim().length === 0}
            onClick={submit}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
