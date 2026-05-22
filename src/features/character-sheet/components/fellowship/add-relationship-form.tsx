"use client";
import { useState, useTransition, type FormEvent } from "react";
import { ChevronDown, Plus } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { cn } from "@/shared/lib/cn";
import { mutateRelationships } from "../../actions";
import { CharacterId, type CampaignRosterEntry } from "../../schemas";

type Polarity = "helpful" | "hindering";

interface AddRelationshipFormProps {
  characterId: CharacterId;
  roster: readonly CampaignRosterEntry[];
  selfCharacterId: CharacterId;
}

const ACTIVE_CLASS: Record<Polarity, string> = {
  helpful:
    "bg-tag-power-soft text-tag-power-text dark:bg-tag-power-soft-dark dark:text-tag-power-text-dark",
  hindering:
    "bg-tag-weakness-soft text-tag-weakness-text dark:bg-tag-weakness-soft-dark dark:text-tag-weakness-text-dark",
};

export function AddRelationshipForm({
  characterId,
  roster,
  selfCharacterId,
}: AddRelationshipFormProps) {
  const [companionName, setCompanionName] = useState("");
  const [companionCharId, setCompanionCharId] = useState<CharacterId | null>(
    null,
  );
  const [relationshipTag, setRelationshipTag] = useState("");
  const [polarity, setPolarity] = useState<Polarity>("helpful");
  const [pending, startTransition] = useTransition();
  const callAction = useActionWithToast();

  const candidates = roster.filter((r) => r.characterId !== selfCharacterId);

  const reset = () => {
    setCompanionName("");
    setCompanionCharId(null);
    setRelationshipTag("");
    setPolarity("helpful");
  };

  const submit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    const name = companionName.trim();
    const tag = relationshipTag.trim();
    if (!name || !tag) return;
    startTransition(async () => {
      const result = await callAction(
        mutateRelationships({
          characterId,
          op: {
            kind: "add",
            companionName: name,
            companionCharId,
            relationshipTag: tag,
            polarity,
          },
        }),
        { onSuccess: "Relationship added" },
      );
      if (result) reset();
    });
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft"
    >
      <div className="flex flex-col gap-1 text-sm">
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Companion
        </span>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={companionName}
            onChange={(e) => {
              setCompanionName(e.currentTarget.value);
              setCompanionCharId(null);
            }}
            placeholder="Companion name…"
            maxLength={60}
            disabled={pending}
            aria-label="Companion name"
            className="flex-1 border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm text-ink-base placeholder:text-ink-subtle focus:border-ember focus:outline-none dark:border-mist-dark dark:text-parchment-base dark:placeholder:text-parchment-subtle"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={pending}
                className="inline-flex h-10 items-center gap-1 rounded border border-mist-light px-3 text-sm text-ink-muted hover:bg-parchment-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:border-mist-dark dark:text-parchment-muted dark:hover:bg-ink-elevated"
              >
                Pick from party
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {candidates.length === 0 ? (
                <DropdownMenuItem disabled>No other party members</DropdownMenuItem>
              ) : (
                candidates.map((entry) => (
                  <DropdownMenuItem
                    key={entry.characterId}
                    onSelect={() => {
                      setCompanionName(entry.characterName);
                      setCompanionCharId(
                        CharacterId.parse(entry.characterId),
                      );
                    }}
                  >
                    {entry.characterName}
                  </DropdownMenuItem>
                ))
              )}
              <DropdownMenuItem
                onSelect={() => {
                  setCompanionCharId(null);
                  setCompanionName("");
                }}
              >
                Custom (out-of-party)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Relationship
        </span>
        <input
          type="text"
          value={relationshipTag}
          onChange={(e) => setRelationshipTag(e.currentTarget.value)}
          placeholder="e.g. indebted, sworn-friend…"
          maxLength={60}
          disabled={pending}
          aria-label="Relationship tag"
          className="border-0 border-b border-mist-light bg-transparent px-1 py-1 text-sm text-ink-base placeholder:text-ink-subtle focus:border-ember focus:outline-none dark:border-mist-dark dark:text-parchment-base dark:placeholder:text-parchment-subtle"
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
                  ? ACTIVE_CLASS[p]
                  : "text-ink-muted hover:bg-parchment-elevated dark:text-parchment-muted dark:hover:bg-ink-elevated",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={
            pending ||
            companionName.trim().length === 0 ||
            relationshipTag.trim().length === 0
          }
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add relationship
        </Button>
      </div>
    </form>
  );
}
