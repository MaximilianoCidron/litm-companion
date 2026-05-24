"use client";
import { useTransition } from "react";
import { Dices, Loader2, Shield, Target } from "lucide-react";
import { Button, ConfirmDialog } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { commitRoll } from "../../actions";
import { useCharacter } from "../CharacterProvider";
import { useUserSettings } from "../UserSettingsProvider";
import {
  useInvokedStatuses,
  useInvokedTags,
  useIsDetailedAction,
  useIsReaction,
  useMightModifier,
  useRollBuilder,
} from "../../stores/roll-builder";
import type {
  CampaignId,
  ChallengeId,
  PendingThreatId,
  StatusInvocationInput,
  TagInvocationInput,
} from "../../schemas";

function buildRollSummary({
  tagCount,
  statusCount,
  mightModifier,
}: {
  tagCount: number;
  statusCount: number;
  mightModifier: number;
}): string {
  const parts: string[] = [];
  if (tagCount > 0) parts.push(`${tagCount} tag${tagCount === 1 ? "" : "s"}`);
  if (statusCount > 0)
    parts.push(`${statusCount} status${statusCount === 1 ? "" : "es"}`);
  if (mightModifier !== 0) {
    parts.push(
      `${mightModifier > 0 ? "+" : ""}${mightModifier} might`,
    );
  }
  return parts.length > 0 ? parts.join(" · ") : "no selections";
}

export function RollButton() {
  const { character } = useCharacter();
  const invokedTags = useInvokedTags();
  const invokedStatuses = useInvokedStatuses();
  const mightModifier = useMightModifier();
  const isReaction = useIsReaction();
  const isDetailedAction = useIsDetailedAction();
  const confirmBeforeRolling = useUserSettings().confirmBeforeRolling;
  const openResultDialog = useRollBuilder((s) => s.openResultDialog);
  const resetSelectionOnly = useRollBuilder((s) => s.resetSelectionOnly);
  const callAction = useActionWithToast();
  const [pending, startTransition] = useTransition();

  const nothing =
    invokedTags.size === 0 &&
    invokedStatuses.size === 0 &&
    mightModifier === 0;
  const disabled = pending || nothing;

  const doCommit = () =>
    new Promise<void>((resolve) => {
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
        ).map((entry) => ({
          statusId: entry.statusId,
          location: entry.location,
        }));

        const reactingToPendingThreatId =
          useRollBuilder.getState().reactingToPendingThreatId;
        const reactingToCampaignId =
          useRollBuilder.getState().reactingToCampaignId;
        const reactingTo =
          reactingToPendingThreatId && reactingToCampaignId
            ? {
                pendingThreatId: reactingToPendingThreatId as PendingThreatId,
                campaignId: reactingToCampaignId as CampaignId,
              }
            : undefined;

        const detailedChallengeId =
          useRollBuilder.getState().detailedActionChallengeId;
        const detailedCampaignId =
          useRollBuilder.getState().detailedActionCampaignId;
        const detailedActionTarget =
          isDetailedAction && detailedChallengeId && detailedCampaignId
            ? {
                challengeId: detailedChallengeId as ChallengeId,
                campaignId: detailedCampaignId as CampaignId,
              }
            : null;

        const result = await callAction(
          commitRoll({
            characterId: character.id,
            isReaction,
            invocations: { tags, statuses },
            mightModifier,
            isDetailedAction,
            detailedActionTarget,
            ...(reactingTo ? { reactingTo } : {}),
          }),
        );
        if (result) {
          openResultDialog(result.rollId);
          resetSelectionOnly();
          useRollBuilder.getState().clearReaction();
          useRollBuilder.getState().clearDetailedAction();
        }
        resolve();
      });
    });

  const label = pending
    ? "Rolling…"
    : nothing
      ? "Pick a tag, status, or modifier"
      : isReaction
        ? "Roll Reaction"
        : isDetailedAction
          ? "Roll Detailed action"
          : "Roll 2d6 + Power";

  const Icon = pending
    ? Loader2
    : isReaction
      ? Shield
      : isDetailedAction
        ? Target
        : Dices;

  const button = (
    <Button
      type="button"
      variant="primary"
      size="lg"
      fullWidth
      disabled={disabled}
      onClick={confirmBeforeRolling ? undefined : () => void doCommit()}
    >
      <Icon
        className={pending ? "h-5 w-5 animate-spin" : "h-5 w-5"}
        aria-hidden="true"
      />
      {label}
    </Button>
  );

  if (!confirmBeforeRolling) return button;

  const summary = buildRollSummary({
    tagCount: invokedTags.size,
    statusCount: invokedStatuses.size,
    mightModifier,
  });

  return (
    <ConfirmDialog
      trigger={button}
      title="Roll with this selection?"
      description={summary}
      confirmLabel="Roll"
      onConfirm={doCommit}
    />
  );
}
