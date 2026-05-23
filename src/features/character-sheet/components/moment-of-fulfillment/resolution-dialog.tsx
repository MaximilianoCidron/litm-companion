"use client";

import { useState } from "react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { resolveMomentOfFulfillment } from "../../actions";
import { useCharacter } from "../CharacterProvider";
import type { MomentOfFulfillmentPath } from "../../schemas";
import { PathPicker } from "./path-picker";
import { PathConfig } from "./path-config";
import { BurnedRestoreToggle } from "./burned-restore-toggle";
import { MomentHistoryList } from "./history-list";
import {
  EMPTY_PAYLOAD,
  buildChoiceFromPayload,
  countBurnedTags,
  pathMeta,
  validatePayload,
  type MomentOfFulfillmentPayload,
} from "./helpers";

type Step = "intro" | "pickPath" | "configure" | "review";

interface ResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MomentOfFulfillmentDialog({
  open,
  onOpenChange,
}: ResolutionDialogProps) {
  const { character } = useCharacter();
  const callAction = useActionWithToast();

  const [step, setStep] = useState<Step>("intro");
  const [chosenPath, setChosenPath] = useState<MomentOfFulfillmentPath | null>(
    null,
  );
  const [payload, setPayload] = useState<MomentOfFulfillmentPayload>(EMPTY_PAYLOAD);
  const [restoreBurned, setRestoreBurned] = useState(true);
  const [pending, setPending] = useState(false);

  const burnedCount = countBurnedTags(character);
  const validationReason = chosenPath
    ? validatePayload(chosenPath, payload)
    : "Pick a path";
  const reset = () => {
    setStep("intro");
    setChosenPath(null);
    setPayload(EMPTY_PAYLOAD);
    setRestoreBurned(true);
    setPending(false);
  };

  const close = () => {
    if (pending) return;
    onOpenChange(false);
    reset();
  };

  const confirm = async () => {
    if (!chosenPath || validationReason) return;
    setPending(true);
    const result = await callAction(
      resolveMomentOfFulfillment({
        characterId: character.id,
        choice: buildChoiceFromPayload(chosenPath, payload),
        restoreBurnedTags: restoreBurned,
      }),
    );
    setPending(false);
    if (result) {
      toast.success(result.summaryMessage);
      onOpenChange(false);
      reset();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent aria-describedby={undefined} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Moment of Fulfillment</DialogTitle>
        </DialogHeader>
        <DialogBody aria-live="polite" className="flex flex-col gap-4">
          {step === "intro" ? (
            <div className="flex flex-col gap-4">
              <p className="font-serif italic text-ink-base dark:text-parchment-base">
                Your Promise has been kept. A turning point arrives — choose
                how your hero&apos;s story shifts.
              </p>
              <MomentHistoryList
                entries={character.progression.momentsOfFulfillment}
              />
            </div>
          ) : null}

          {step === "pickPath" ? (
            <PathPicker value={chosenPath} onChange={setChosenPath} />
          ) : null}

          {step === "configure" && chosenPath ? (
            <div className="flex flex-col gap-4">
              <PathConfig
                path={chosenPath}
                character={character}
                payload={payload}
                onChange={setPayload}
              />
              <BurnedRestoreToggle
                burnedCount={burnedCount}
                value={restoreBurned}
                onChange={setRestoreBurned}
              />
            </div>
          ) : null}

          {step === "review" && chosenPath ? (
            <ReviewStep
              path={chosenPath}
              payload={payload}
              restoreBurned={restoreBurned}
              burnedCount={burnedCount}
            />
          ) : null}
        </DialogBody>
        <DialogFooter>
          {step !== "intro" ? (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => {
                if (step === "pickPath") setStep("intro");
                else if (step === "configure") setStep("pickPath");
                else if (step === "review") setStep("configure");
              }}
            >
              Back
            </Button>
          ) : null}
          <Button type="button" variant="ghost" disabled={pending} onClick={close}>
            Cancel
          </Button>
          {step === "intro" ? (
            <Button type="button" onClick={() => setStep("pickPath")}>
              Begin
            </Button>
          ) : null}
          {step === "pickPath" ? (
            <Button
              type="button"
              disabled={!chosenPath}
              onClick={() => setStep("configure")}
            >
              Continue
            </Button>
          ) : null}
          {step === "configure" ? (
            <Button
              type="button"
              disabled={Boolean(validationReason)}
              title={validationReason ?? undefined}
              onClick={() => setStep("review")}
            >
              Continue
            </Button>
          ) : null}
          {step === "review" ? (
            <Button type="button" disabled={pending} onClick={confirm}>
              Resolve this moment
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ReviewStep({
  path,
  payload,
  restoreBurned,
  burnedCount,
}: {
  path: MomentOfFulfillmentPath;
  payload: MomentOfFulfillmentPayload;
  restoreBurned: boolean;
  burnedCount: number;
}) {
  const meta = pathMeta(path);
  const description = describePayload(path, payload);
  const restoreLine =
    restoreBurned && burnedCount > 0
      ? `${burnedCount} burned tag${burnedCount === 1 ? "" : "s"} will be restored`
      : null;
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-ember/40 bg-ember/5 p-3">
      <div className="flex items-center gap-2">
        <meta.Icon className="h-5 w-5 text-ember" aria-hidden="true" />
        <span className="font-display text-base">{meta.label}</span>
      </div>
      {description ? (
        <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
          &ldquo;{description}&rdquo;
        </p>
      ) : null}
      <ul className="mt-1 flex flex-col gap-0.5 text-sm text-ink-base dark:text-parchment-base">
        {restoreLine ? <li>· {restoreLine}</li> : null}
        <li>· Promise will reset to 0</li>
      </ul>
    </div>
  );
}

function describePayload(
  path: MomentOfFulfillmentPath,
  payload: MomentOfFulfillmentPayload,
): string {
  switch (path) {
    case "retire":
      return payload.retireDescription.trim();
    case "reforge":
      return payload.reforgeDescription.trim();
    case "gainQuintessence":
      return payload.quintessenceText.trim();
    case "shakeWorld":
      return payload.shakeWorldDescription.trim();
    case "speakWordsEternal":
      return payload.speakWordsEternalDescription.trim();
    case "unearthTruths":
      return payload.unearthTruthsDescription.trim();
  }
}
