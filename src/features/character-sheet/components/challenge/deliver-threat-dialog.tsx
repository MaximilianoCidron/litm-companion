"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Send } from "lucide-react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  toast,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { cn } from "@/shared/lib/cn";
import { deliverThreat } from "../../actions";
import { useChallenge } from "../challenge-provider";
import { useRoster } from "../RosterProvider";
import type {
  CharacterId,
  ChallengeThreat,
  TagId,
  TagLocation,
  ThemeId,
} from "../../schemas";
import {
  buildDeliverySuccessMessage,
  formatConsequenceTemplate,
} from "./helpers";

interface DeliverThreatDialogProps {
  threat: ChallengeThreat;
}

type Step = "pickTarget" | "configure" | "confirm";

interface ScratchTargetDraft {
  location: TagLocation;
  tagId: TagId;
  name: string;
}

export function DeliverThreatDialog({ threat }: DeliverThreatDialogProps) {
  const { challenge } = useChallenge();
  const roster = useRoster();
  const callAction = useActionWithToast();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("pickTarget");
  const [targetCharacterId, setTargetCharacterId] =
    useState<CharacterId | null>(null);
  const [chosenThemeId, setChosenThemeId] = useState<ThemeId | null>(null);
  const [scratchTarget, setScratchTarget] =
    useState<ScratchTargetDraft | null>(null);
  const [pending, startTransition] = useTransition();

  const template = threat.consequenceTemplate;
  const needsConfigure =
    template.kind === "markTrack" || template.kind === "scratchTag";

  const target = useMemo(
    () =>
      targetCharacterId
        ? roster.find((c) => c.id === targetCharacterId) ?? null
        : null,
    [roster, targetCharacterId],
  );

  const reset = () => {
    setStep("pickTarget");
    setTargetCharacterId(null);
    setChosenThemeId(null);
    setScratchTarget(null);
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const advanceFromTarget = () => {
    if (!targetCharacterId) return;
    setStep(needsConfigure ? "configure" : "confirm");
  };

  const advanceFromConfigure = () => {
    if (template.kind === "markTrack" && !chosenThemeId) return;
    if (template.kind === "scratchTag" && !scratchTarget) return;
    setStep("confirm");
  };

  const deliver = () => {
    if (!targetCharacterId) return;
    if (template.kind === "markTrack" && !chosenThemeId) return;
    if (template.kind === "scratchTag" && !scratchTarget) return;

    startTransition(async () => {
      const result = await callAction(
        deliverThreat({
          challengeId: challenge.id,
          campaignId: challenge.campaignId,
          threatId: threat.id,
          targetCharacterId,
          ...(template.kind === "scratchTag" && scratchTarget
            ? {
                scratchTarget: {
                  location: scratchTarget.location,
                  tagId: scratchTarget.tagId,
                },
              }
            : {}),
          ...(template.kind === "markTrack" && chosenThemeId
            ? { markTrackTarget: { themeId: chosenThemeId } }
            : {}),
        }),
      );
      if (result) {
        toast.success(buildDeliverySuccessMessage(result));
        if (template.kind === "custom") {
          toast.show({
            title: "Custom consequence",
            description: String(result.details.description ?? ""),
          });
        }
        setOpen(false);
        reset();
      }
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="primary" size="sm">
          <Send className="h-3.5 w-3.5" aria-hidden="true" />
          Deliver
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Deliver threat</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <div className="rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft">
            <p className="font-serif italic text-ink-base dark:text-parchment-base">
              {threat.description}
            </p>
            <p className="mt-1 text-xs text-ink-muted dark:text-parchment-muted">
              {formatConsequenceTemplate(template)}
            </p>
          </div>

          <div aria-live="polite" className="flex flex-col gap-3">
            {step === "pickTarget" ? (
              <PickTargetStep
                value={targetCharacterId}
                onChange={setTargetCharacterId}
              />
            ) : null}

            {step === "configure" && template.kind === "markTrack" && target ? (
              <PickThemeStep
                track={template.track}
                themes={target.themes}
                value={chosenThemeId}
                onChange={setChosenThemeId}
              />
            ) : null}

            {step === "configure" && template.kind === "scratchTag" && target ? (
              <PickTagStep
                target={target}
                value={scratchTarget}
                onChange={setScratchTarget}
              />
            ) : null}

            {step === "confirm" && target ? (
              <ConfirmStep
                threatDescription={threat.description}
                targetName={target.identity.name || "Unnamed hero"}
                template={template}
                chosenThemeName={
                  chosenThemeId
                    ? target.themes.find((t) => t.id === chosenThemeId)?.name ??
                      null
                    : null
                }
                scratchName={scratchTarget?.name ?? null}
              />
            ) : null}
          </div>
        </DialogBody>
        <DialogFooter>
          {step !== "pickTarget" ? (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                setStep(
                  step === "confirm" && needsConfigure
                    ? "configure"
                    : "pickTarget",
                )
              }
            >
              Back
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          {step === "pickTarget" ? (
            <Button
              type="button"
              disabled={!targetCharacterId || pending}
              onClick={advanceFromTarget}
            >
              Next
            </Button>
          ) : null}
          {step === "configure" ? (
            <Button
              type="button"
              disabled={
                pending ||
                (template.kind === "markTrack" && !chosenThemeId) ||
                (template.kind === "scratchTag" && !scratchTarget)
              }
              onClick={advanceFromConfigure}
            >
              Next
            </Button>
          ) : null}
          {step === "confirm" ? (
            <Button type="button" disabled={pending} onClick={deliver}>
              <Send className="h-3.5 w-3.5" aria-hidden="true" />
              Deliver
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PickTargetStep({
  value,
  onChange,
}: {
  value: CharacterId | null;
  onChange: (next: CharacterId) => void;
}) {
  const roster = useRoster();
  if (roster.length === 0) {
    return (
      <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
        No heroes in this fellowship yet.
      </p>
    );
  }
  return (
    <div role="radiogroup" aria-label="Pick a target hero" className="flex flex-col gap-2">
      {roster.map((char) => {
        const active = value === char.id;
        return (
          <button
            key={char.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(char.id)}
            className={cn(
              "flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
              active
                ? "border-ember bg-ember/10"
                : "border-mist-light bg-parchment-elevated hover:bg-parchment-soft dark:border-mist-dark dark:bg-ink-elevated dark:hover:bg-ink-soft",
            )}
          >
            <span className="font-display text-base text-ink-base dark:text-parchment-base">
              {char.identity.name || "Unnamed hero"}
            </span>
            <span className="text-xs text-ink-subtle dark:text-parchment-subtle">
              {char.identity.concept || "—"}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PickThemeStep({
  track,
  themes,
  value,
  onChange,
}: {
  track: "improve" | "milestone" | "abandon";
  themes: readonly { id: ThemeId; name: string; tracks: { improve: number; milestone: number; abandon: number } }[];
  value: ThemeId | null;
  onChange: (next: ThemeId) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Pick a theme" className="flex flex-col gap-2">
      <p className="text-xs text-ink-muted dark:text-parchment-muted">
        Which theme should mark <strong className="capitalize">{track}</strong>?
      </p>
      {themes.map((theme) => {
        const at = theme.tracks[track];
        const full = at >= 3;
        const active = value === theme.id;
        return (
          <button
            key={theme.id}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={full}
            onClick={() => onChange(theme.id)}
            className={cn(
              "flex items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
              active
                ? "border-ember bg-ember/10"
                : "border-mist-light bg-parchment-elevated hover:bg-parchment-soft dark:border-mist-dark dark:bg-ink-elevated dark:hover:bg-ink-soft",
              full && "cursor-not-allowed opacity-60",
            )}
          >
            <span className="font-display">{theme.name || "Unnamed theme"}</span>
            <span className="text-xs">
              {track} {at}/3
              {full ? " · already at maximum" : ""}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PickTagStep({
  target,
  value,
  onChange,
}: {
  target: import("../../schemas").Character;
  value: ScratchTargetDraft | null;
  onChange: (next: ScratchTargetDraft) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Pick a tag to scratch" className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <h4 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          Power tags
        </h4>
        {target.themes.map((theme) => (
          <div key={theme.id} className="flex flex-col gap-1">
            <span className="text-xs text-ink-subtle dark:text-parchment-subtle">
              {theme.name || "Unnamed theme"}
            </span>
            <div className="flex flex-wrap gap-2">
              {theme.powerTags.length === 0 ? (
                <span className="text-xs italic text-ink-subtle dark:text-parchment-subtle">
                  No power tags.
                </span>
              ) : (
                theme.powerTags.map((tag) => {
                  const disabled = tag.scratched || tag.burned;
                  const active =
                    value?.location.kind === "theme" &&
                    value.tagId === (tag.id as TagId) &&
                    value.location.themeId === theme.id;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={disabled}
                      onClick={() =>
                        onChange({
                          location: { kind: "theme", themeId: theme.id },
                          tagId: tag.id as TagId,
                          name: tag.name,
                        })
                      }
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs transition-colors",
                        active
                          ? "border-ember bg-ember/15"
                          : "border-mist-light bg-parchment-elevated dark:border-mist-dark dark:bg-ink-elevated",
                        disabled && "cursor-not-allowed opacity-50 line-through",
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <h4 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          Story tags
        </h4>
        <div className="flex flex-wrap gap-2">
          {target.backpack.storyTags.length === 0 ? (
            <span className="text-xs italic text-ink-subtle dark:text-parchment-subtle">
              No story tags.
            </span>
          ) : (
            target.backpack.storyTags.map((tag) => {
              const disabled = tag.scratched;
              const active =
                value?.location.kind === "backpack" &&
                value.tagId === (tag.id as TagId);
              return (
                <button
                  key={tag.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      location: { kind: "backpack" },
                      tagId: tag.id as TagId,
                      name: tag.name,
                    })
                  }
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-ember bg-ember/15"
                      : "border-mist-light bg-parchment-elevated dark:border-mist-dark dark:bg-ink-elevated",
                    disabled && "cursor-not-allowed opacity-50 line-through",
                  )}
                >
                  {tag.name}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ConfirmStep({
  threatDescription,
  targetName,
  template,
  chosenThemeName,
  scratchName,
}: {
  threatDescription: string;
  targetName: string;
  template: ChallengeThreat["consequenceTemplate"];
  chosenThemeName: string | null;
  scratchName: string | null;
}) {
  let summary: string;
  if (template.kind === "applyStatus") {
    summary = `Apply ${template.statusName}-${template.tier} (${template.polarity}) to ${targetName}.`;
  } else if (template.kind === "markTrack") {
    const sign = template.delta > 0 ? "+1" : "−1";
    summary = `Mark ${template.track} (${sign}) on ${chosenThemeName ?? "—"} of ${targetName}.`;
  } else if (template.kind === "scratchTag") {
    summary = `Scratch "${scratchName ?? "—"}" on ${targetName}.`;
  } else {
    summary = `Apply custom consequence to ${targetName} (no mechanical change).`;
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-ink-base dark:text-parchment-base">{summary}</p>
      <p className="text-xs italic text-ink-subtle dark:text-parchment-subtle">
        Threat: "{threatDescription.slice(0, 80)}
        {threatDescription.length > 80 ? "…" : ""}"
      </p>
    </div>
  );
}
