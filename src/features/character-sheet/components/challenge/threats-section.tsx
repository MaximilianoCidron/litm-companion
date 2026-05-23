"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  Button,
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { mutateChallenge } from "../../actions";
import { useChallenge } from "../challenge-provider";
import type { ChallengeThreat, ConsequenceTemplate, ThreatId } from "../../schemas";
import { ConsequenceTemplateForm } from "./consequence-template-form";
import { DeliverThreatDialog } from "./deliver-threat-dialog";
import { formatConsequenceTemplate } from "./helpers";

const DEFAULT_TEMPLATE: ConsequenceTemplate = {
  kind: "applyStatus",
  statusName: "",
  tier: 1,
  polarity: "hindering",
};

export function ThreatsSection() {
  const { challenge } = useChallenge();
  return (
    <section className="flex flex-col gap-3">
      <h3 className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        Threats
      </h3>
      {challenge.threats.length > 0 ? (
        <ul className="flex flex-col gap-3">
          {challenge.threats.map((threat) => (
            <li key={threat.id}>
              <ThreatRow threat={threat} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
          No threats yet.
        </p>
      )}
      <AddThreatDialog />
    </section>
  );
}

function ThreatRow({ threat }: { threat: ChallengeThreat }) {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const threatIdBranded = threat.id as ThreatId;

  return (
    <div className="rounded-lg border border-mist-light bg-parchment-elevated p-4 dark:border-mist-dark dark:bg-ink-elevated">
      <p className="font-serif italic text-ink-base dark:text-parchment-base">
        {threat.description}
      </p>
      <p className="mt-1 text-xs text-ink-muted dark:text-parchment-muted">
        {formatConsequenceTemplate(threat.consequenceTemplate)}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <DeliverThreatDialog threat={threat} />
        <EditThreatDialog threat={threat} />
        <ConfirmDialog
          trigger={
            <Button type="button" variant="ghost" size="sm">
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Delete
            </Button>
          }
          title="Delete this threat?"
          description="This threat will be removed from the challenge."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={async () => {
            await callAction(
              mutateChallenge({
                challengeId: challenge.id,
                campaignId: challenge.campaignId,
                op: { kind: "removeThreat", threatId: threatIdBranded },
              }),
              { onSuccess: "Threat removed" },
            );
          }}
        />
      </div>
    </div>
  );
}

function AddThreatDialog() {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [template, setTemplate] = useState<ConsequenceTemplate>(DEFAULT_TEMPLATE);
  const [pending, startTransition] = useTransition();
  const atLimit = challenge.threats.length >= 20;

  const reset = () => {
    setDescription("");
    setTemplate(DEFAULT_TEMPLATE);
  };

  const submit = () => {
    const trimmed = description.trim();
    if (!trimmed) return;
    if (template.kind === "applyStatus" && template.statusName.trim() === "")
      return;
    if (template.kind === "custom" && template.description.trim() === "")
      return;

    startTransition(async () => {
      const result = await callAction(
        mutateChallenge({
          challengeId: challenge.id,
          campaignId: challenge.campaignId,
          op: {
            kind: "addThreat",
            description: trimmed,
            consequenceTemplate: template,
          },
        }),
        { onSuccess: "Threat added" },
      );
      if (result) {
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
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={atLimit}
          className="self-start"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add threat
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add threat</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Description
            </span>
            <textarea
              value={description}
              maxLength={280}
              rows={3}
              autoFocus
              onChange={(e) => setDescription(e.currentTarget.value)}
              placeholder="What does the threat do in the fiction?"
              className="rounded-lg border border-mist-light bg-parchment-elevated p-2 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
            />
          </label>
          <ConsequenceTemplateForm value={template} onChange={setTemplate} disabled={pending} />
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || description.trim() === ""}
            onClick={submit}
          >
            Add threat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditThreatDialog({ threat }: { threat: ChallengeThreat }) {
  const { challenge } = useChallenge();
  const callAction = useActionWithToast();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(threat.description);
  const [template, setTemplate] = useState<ConsequenceTemplate>(
    threat.consequenceTemplate,
  );
  const [pending, startTransition] = useTransition();
  const threatIdBranded = threat.id as ThreatId;

  const submit = () => {
    const trimmed = description.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await callAction(
        mutateChallenge({
          challengeId: challenge.id,
          campaignId: challenge.campaignId,
          op: {
            kind: "updateThreat",
            threatId: threatIdBranded,
            description: trimmed,
            consequenceTemplate: template,
          },
        }),
        { onSuccess: "Threat updated" },
      );
      if (result) setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        if (next) {
          setDescription(threat.description);
          setTemplate(threat.consequenceTemplate);
        }
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined} className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit threat</DialogTitle>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
              Description
            </span>
            <textarea
              value={description}
              maxLength={280}
              rows={3}
              onChange={(e) => setDescription(e.currentTarget.value)}
              className="rounded-lg border border-mist-light bg-parchment-elevated p-2 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
            />
          </label>
          <ConsequenceTemplateForm value={template} onChange={setTemplate} disabled={pending} />
        </DialogBody>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || description.trim() === ""}
            onClick={submit}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
