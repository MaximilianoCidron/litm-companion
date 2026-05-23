"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { endCampActivity } from "../../actions";
import { useCharacter } from "../CharacterProvider";
import type { ThemeId } from "../../schemas";
import { ActivityPicker } from "./activity-picker";
import { ReflectThemePicker } from "./reflect-theme-picker";
import { StoryTagPreservationList } from "./story-tag-preservation-list";
import { CampSummary } from "./camp-summary";
import { buildCampSummaryToast, forecastCamp, type CampActivity } from "./helpers";

interface MakeCampDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MakeCampDialog({ open, onOpenChange }: MakeCampDialogProps) {
  const { character } = useCharacter();
  const callAction = useActionWithToast();
  const router = useRouter();

  const [activity, setActivity] = useState<CampActivity>("rest");
  const [reflectThemeId, setReflectThemeId] = useState<ThemeId | null>(null);
  const [campDescription, setCampDescription] = useState("");
  const [pending, setPending] = useState(false);

  const forecast = useMemo(
    () => forecastCamp(character, activity, reflectThemeId),
    [character, activity, reflectThemeId],
  );

  const submitDisabled =
    pending || (activity === "reflect" && reflectThemeId === null);

  const reset = () => {
    setActivity("rest");
    setReflectThemeId(null);
    setCampDescription("");
    setPending(false);
  };

  const handleSubmit = async () => {
    if (submitDisabled) return;
    setPending(true);
    const result = await callAction(
      endCampActivity({
        characterId: character.id,
        activity:
          activity === "rest"
            ? { kind: "rest" }
            : activity === "reflect"
              ? { kind: "reflect", themeId: reflectThemeId! }
              : { kind: "campAction", description: campDescription },
      }),
    );
    setPending(false);
    if (!result) return;

    toast.success(buildCampSummaryToast(result.summary));
    if (result.activityNote) {
      toast.show({ title: "Camp action", description: result.activityNote });
    }
    router.refresh();
    onOpenChange(false);
    reset();
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
      <DialogContent aria-describedby={undefined} className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Make camp</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <section className="flex flex-col gap-2">
            <h3 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Choose your activity
            </h3>
            <ActivityPicker value={activity} onChange={setActivity} />
          </section>

          {activity === "rest" ? (
            <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
              Your party rests through the long hours. All hindering statuses
              fade. Every scratched power tag refreshes.
            </p>
          ) : null}

          {activity === "reflect" ? (
            <section className="flex flex-col gap-2">
              <h3 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
                Reflect on…
              </h3>
              <ReflectThemePicker
                themes={character.themes}
                value={reflectThemeId}
                onChange={setReflectThemeId}
              />
            </section>
          ) : null}

          {activity === "campAction" ? (
            <section className="flex flex-col gap-2">
              <label
                htmlFor="camp-description"
                className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted"
              >
                What did you do?
              </label>
              <textarea
                id="camp-description"
                value={campDescription}
                onChange={(e) => setCampDescription(e.currentTarget.value)}
                maxLength={280}
                rows={3}
                placeholder="What did you do? (e.g., scouted ahead, mended your cloak, sketched the cave entrance…)"
                className="rounded-lg border border-mist-light bg-parchment-elevated p-2 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
              />
              <span className="self-end text-xs text-ink-subtle dark:text-parchment-subtle">
                {campDescription.length}/280
              </span>
            </section>
          ) : null}

          <section className="flex flex-col gap-2">
            <h3 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Story tags
            </h3>
            <StoryTagPreservationList
              characterId={character.id}
              storyTags={character.backpack.storyTags}
            />
          </section>

          <CampSummary forecast={forecast} activity={activity} />
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={submitDisabled}
            onClick={() => void handleSubmit()}
          >
            Make camp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
