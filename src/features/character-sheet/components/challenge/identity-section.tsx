"use client";

import { useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Button, EditableField } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { cn } from "@/shared/lib/cn";
import { mutateChallenge } from "../../actions";
import { useChallenge } from "../challenge-provider";
import type { ChallengeRole, MightLevel } from "../../schemas";
import { RolePicker } from "./role-picker";
import { MightPicker } from "./might-picker";

export function IdentitySection() {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();

  const setName = useCallback(
    (name: string) =>
      mutateChallenge({
        challengeId: challenge.id,
        campaignId: challenge.campaignId,
        op: { kind: "setName", name },
      }),
    [challenge.id, challenge.campaignId],
  );

  const setConcept = useCallback(
    (concept: string) =>
      mutateChallenge({
        challengeId: challenge.id,
        campaignId: challenge.campaignId,
        op: { kind: "setConcept", concept },
      }),
    [challenge.id, challenge.campaignId],
  );

  const setRole = (role: ChallengeRole) =>
    callAction(
      mutateChallenge({
        challengeId: challenge.id,
        campaignId: challenge.campaignId,
        op: { kind: "setRole", role },
      }),
    );

  const setMight = (mightLevel: MightLevel) =>
    callAction(
      mutateChallenge({
        challengeId: challenge.id,
        campaignId: challenge.campaignId,
        op: { kind: "setMightLevel", mightLevel },
      }),
    );

  return (
    <section className="flex flex-col gap-3">
      <EditableField
        value={challenge.name}
        onCommit={setName}
        ariaLabel="Challenge name"
        maxLength={80}
        fontPreset="display"
        className="text-2xl"
      />
      <EditableField
        multiline
        value={challenge.concept}
        onCommit={setConcept}
        ariaLabel="Challenge concept"
        maxLength={280}
        fontPreset="prose"
        placeholder="A short concept — what this challenge is."
      />
      <div className="flex flex-wrap items-center gap-3">
        <RolePicker value={challenge.role} onChange={setRole} />
        <MightPicker value={challenge.mightLevel} onChange={setMight} />
      </div>

      <EngagementToggle />
    </section>
  );
}

function EngagementToggle() {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const engaged = challenge.engaged;
  const toggle = () => {
    void callAction(
      mutateChallenge({
        challengeId: challenge.id,
        campaignId: challenge.campaignId,
        op: { kind: "setEngaged", engaged: !engaged },
      }),
      {
        onSuccess: !engaged
          ? "Players can now see this challenge"
          : "Hidden from players again",
      },
    );
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-mist-light bg-parchment-soft p-4 dark:border-mist-dark dark:bg-ink-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
            Engagement
          </h3>
          <p className="max-w-md text-xs text-ink-muted dark:text-parchment-muted">
            When engaged, this challenge&apos;s name and tags become visible
            to players in their roll builder. Statuses, limits, threats, and
            notes stay private to you.
          </p>
        </div>
        <Button
          type="button"
          variant={engaged ? "primary" : "secondary"}
          size="sm"
          role="switch"
          aria-checked={engaged}
          aria-label={engaged ? "Disengage challenge" : "Engage challenge"}
          onClick={toggle}
          className={cn(engaged && "fx-celebrate")}
        >
          {engaged ? (
            <>
              <Eye className="h-4 w-4" aria-hidden="true" />
              Engaged
            </>
          ) : (
            <>
              <EyeOff className="h-4 w-4" aria-hidden="true" />
              Hidden
            </>
          )}
        </Button>
      </div>
      {engaged ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-ember-text-light dark:text-ember-text-dark">
          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
          Players can see {challenge.tags.length} tag
          {challenge.tags.length === 1 ? "" : "s"} right now.
        </p>
      ) : null}
    </div>
  );
}
