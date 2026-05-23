"use client";

import { useCallback } from "react";
import { EditableField } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
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
    </section>
  );
}
