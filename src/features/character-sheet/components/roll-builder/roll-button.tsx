"use client";
import { useTransition } from "react";
import { Dices, Loader2, Shield } from "lucide-react";
import { Button } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { commitRoll } from "../../actions";
import { useCharacter } from "../CharacterProvider";
import {
  useInvokedStatuses,
  useInvokedTags,
  useIsReaction,
  useMightModifier,
  useRollBuilder,
} from "../../stores/roll-builder";
import type { StatusId, StatusInvocationInput, TagInvocationInput } from "../../schemas";

export function RollButton() {
  const { character } = useCharacter();
  const invokedTags = useInvokedTags();
  const invokedStatuses = useInvokedStatuses();
  const mightModifier = useMightModifier();
  const isReaction = useIsReaction();
  const openResultDialog = useRollBuilder((s) => s.openResultDialog);
  const resetSelectionOnly = useRollBuilder((s) => s.resetSelectionOnly);
  const callAction = useActionWithToast();
  const [pending, startTransition] = useTransition();

  const nothing =
    invokedTags.size === 0 &&
    invokedStatuses.size === 0 &&
    mightModifier === 0;
  const disabled = pending || nothing;

  const onClick = () => {
    if (pending) return;
    startTransition(async () => {
      const tags: TagInvocationInput[] = Array.from(invokedTags.values()).map(
        (entry) => ({
          tagId: entry.tagId,
          location: entry.location,
          burn: entry.burn,
        }),
      );
      const statuses: StatusInvocationInput[] = Array.from(
        invokedStatuses.values(),
      ).map((id) => ({ statusId: id as StatusId }));

      const result = await callAction(
        commitRoll({
          characterId: character.id,
          isReaction,
          invocations: { tags, statuses },
          mightModifier,
        }),
      );
      if (result) {
        openResultDialog(result.rollId);
        resetSelectionOnly();
      }
    });
  };

  const label = pending
    ? "Rolling…"
    : nothing
      ? "Pick a tag, status, or modifier"
      : isReaction
        ? "Roll Reaction"
        : "Roll 2d6 + Power";

  const Icon = pending ? Loader2 : isReaction ? Shield : Dices;

  return (
    <Button
      type="button"
      variant="primary"
      size="lg"
      fullWidth
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className={pending ? "h-5 w-5 animate-spin" : "h-5 w-5"} aria-hidden="true" />
      {label}
    </Button>
  );
}
