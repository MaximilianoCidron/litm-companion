"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Send } from "lucide-react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { addSessionLogEntry } from "../../../actions";
import type {
  CampaignId,
  CampaignRosterEntry,
  CharacterId,
} from "../../../schemas";

interface AnnotationComposerProps {
  campaignId: CampaignId;
  roster: readonly CampaignRosterEntry[];
}

const MAX_LENGTH = 2000;

export function AnnotationComposer({
  campaignId,
  roster,
}: AnnotationComposerProps) {
  const callAction = useActionWithToast();
  const [text, setText] = useState("");
  const [subjectId, setSubjectId] = useState<CharacterId | null>(null);
  const [pending, startTransition] = useTransition();

  const subject = subjectId
    ? roster.find((r) => r.characterId === subjectId) ?? null
    : null;

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await callAction(
        addSessionLogEntry({
          campaignId,
          text: trimmed,
          subjectCharacterId: subjectId,
        }),
      );
      if (result) {
        setText("");
        setSubjectId(null);
      }
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="flex flex-col gap-2 rounded-lg border border-mist-light bg-parchment-elevated p-3 dark:border-mist-dark dark:bg-ink-elevated"
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          }
        }}
        maxLength={MAX_LENGTH}
        rows={2}
        placeholder="Note something the party will want to remember…"
        disabled={pending}
        aria-label="Write a session-log note"
        className="resize-y rounded-md border border-mist-light bg-parchment p-2 text-sm text-ink-base focus:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:border-mist-dark dark:bg-ink dark:text-parchment-base"
      />
      <div className="flex items-center justify-between gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending || roster.length === 0}
              aria-label="Link to a hero (optional)"
            >
              {subject ? `→ ${subject.characterName}` : "Link to hero…"}
              <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onSelect={() => setSubjectId(null)}>
              None
            </DropdownMenuItem>
            {roster.map((r) => (
              <DropdownMenuItem
                key={r.characterId}
                onSelect={() => setSubjectId(r.characterId)}
              >
                {r.characterName}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-2">
          {text.length > MAX_LENGTH * 0.9 ? (
            <span className="text-xs text-ink-subtle dark:text-parchment-subtle">
              {text.length}/{MAX_LENGTH}
            </span>
          ) : null}
          <Button
            type="submit"
            size="sm"
            disabled={pending || text.trim().length === 0}
          >
            <Send className="h-3.5 w-3.5" aria-hidden="true" />
            Add
          </Button>
        </div>
      </div>
    </form>
  );
}
