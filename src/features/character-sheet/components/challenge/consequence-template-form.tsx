"use client";

import { Button } from "@/shared/ui";
import { cn } from "@/shared/lib/cn";
import type { ConsequenceTemplate } from "../../schemas";

interface ConsequenceTemplateFormProps {
  value: ConsequenceTemplate;
  onChange: (next: ConsequenceTemplate) => void;
  disabled?: boolean;
}

const KIND_OPTIONS: {
  key: ConsequenceTemplate["kind"];
  label: string;
}[] = [
  { key: "applyStatus", label: "Apply status" },
  { key: "markTrack", label: "Mark track" },
  { key: "scratchTag", label: "Scratch tag" },
  { key: "custom", label: "Custom" },
];

const DEFAULT_BY_KIND: Record<ConsequenceTemplate["kind"], ConsequenceTemplate> = {
  applyStatus: {
    kind: "applyStatus",
    statusName: "",
    tier: 1,
    polarity: "hindering",
  },
  markTrack: { kind: "markTrack", track: "improve", delta: 1 },
  scratchTag: { kind: "scratchTag" },
  custom: { kind: "custom", description: "" },
};

export function ConsequenceTemplateForm({
  value,
  onChange,
  disabled,
}: ConsequenceTemplateFormProps) {
  const setKind = (kind: ConsequenceTemplate["kind"]) => {
    if (kind === value.kind) return;
    onChange(DEFAULT_BY_KIND[kind]);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        role="radiogroup"
        aria-label="Consequence kind"
        className="flex flex-wrap gap-2"
      >
        {KIND_OPTIONS.map((opt) => {
          const active = value.kind === opt.key;
          return (
            <Button
              key={opt.key}
              type="button"
              role="radio"
              aria-checked={active}
              variant={active ? "primary" : "ghost"}
              size="sm"
              disabled={disabled}
              onClick={() => setKind(opt.key)}
              className={cn(
                !active && "border border-mist-light dark:border-mist-dark",
              )}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>

      {value.kind === "applyStatus" ? (
        <ApplyStatusFields value={value} onChange={onChange} disabled={disabled} />
      ) : null}
      {value.kind === "markTrack" ? (
        <MarkTrackFields value={value} onChange={onChange} disabled={disabled} />
      ) : null}
      {value.kind === "scratchTag" ? (
        <ScratchTagFields value={value} onChange={onChange} disabled={disabled} />
      ) : null}
      {value.kind === "custom" ? (
        <CustomFields value={value} onChange={onChange} disabled={disabled} />
      ) : null}
    </div>
  );
}

type FieldProps<K extends ConsequenceTemplate["kind"]> = {
  value: Extract<ConsequenceTemplate, { kind: K }>;
  onChange: (next: ConsequenceTemplate) => void;
  disabled?: boolean;
};

const TIERS = [1, 2, 3, 4, 5, 6] as const;

function ApplyStatusFields({
  value,
  onChange,
  disabled,
}: FieldProps<"applyStatus">) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          Status name
        </span>
        <input
          type="text"
          value={value.statusName}
          maxLength={40}
          disabled={disabled}
          onChange={(e) =>
            onChange({ ...value, statusName: e.currentTarget.value })
          }
          placeholder="e.g., wounded"
          className="h-10 rounded-lg border border-mist-light bg-parchment-elevated px-3 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted self-center">
          Tier
        </span>
        {TIERS.map((tier) => (
          <Button
            key={tier}
            type="button"
            size="sm"
            variant={value.tier === tier ? "primary" : "ghost"}
            disabled={disabled}
            onClick={() => onChange({ ...value, tier })}
            className="w-10 px-0"
          >
            {tier}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="self-center font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          Polarity
        </span>
        {(["helpful", "hindering"] as const).map((p) => (
          <Button
            key={p}
            type="button"
            size="sm"
            variant={value.polarity === p ? "primary" : "ghost"}
            disabled={disabled}
            onClick={() => onChange({ ...value, polarity: p })}
            className="capitalize"
          >
            {p}
          </Button>
        ))}
      </div>
    </div>
  );
}

function MarkTrackFields({ value, onChange, disabled }: FieldProps<"markTrack">) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft">
      <div className="flex flex-wrap gap-2">
        <span className="self-center font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          Track
        </span>
        {(["improve", "milestone", "abandon"] as const).map((t) => (
          <Button
            key={t}
            type="button"
            size="sm"
            variant={value.track === t ? "primary" : "ghost"}
            disabled={disabled}
            onClick={() => onChange({ ...value, track: t })}
            className="capitalize"
          >
            {t}
          </Button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="self-center font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          Delta
        </span>
        {([1, -1] as const).map((d) => (
          <Button
            key={d}
            type="button"
            size="sm"
            variant={value.delta === d ? "primary" : "ghost"}
            disabled={disabled}
            onClick={() => onChange({ ...value, delta: d })}
          >
            {d > 0 ? "+1" : "−1"}
          </Button>
        ))}
      </div>
      <p className="text-xs text-ink-subtle dark:text-parchment-subtle">
        Target theme is chosen at delivery time.
      </p>
    </div>
  );
}

function ScratchTagFields({
  value,
  onChange,
  disabled,
}: FieldProps<"scratchTag">) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-mist-light bg-parchment-soft p-3 dark:border-mist-dark dark:bg-ink-soft">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
          Hint (optional)
        </span>
        <input
          type="text"
          value={value.hint ?? ""}
          maxLength={120}
          disabled={disabled}
          onChange={(e) =>
            onChange({
              ...value,
              hint: e.currentTarget.value || undefined,
            })
          }
          placeholder="e.g., a defensive item"
          className="h-10 rounded-lg border border-mist-light bg-parchment-elevated px-3 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
        />
      </label>
      <p className="text-xs text-ink-subtle dark:text-parchment-subtle">
        GM picks which tag to scratch at delivery time.
      </p>
    </div>
  );
}

function CustomFields({ value, onChange, disabled }: FieldProps<"custom">) {
  return (
    <label className="flex flex-col gap-1 rounded-lg border border-mist-light bg-parchment-soft p-3 text-sm dark:border-mist-dark dark:bg-ink-soft">
      <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        Description
      </span>
      <textarea
        value={value.description}
        maxLength={280}
        rows={3}
        disabled={disabled}
        onChange={(e) =>
          onChange({ ...value, description: e.currentTarget.value })
        }
        placeholder="A narrative consequence the GM will apply manually."
        className="rounded-lg border border-mist-light bg-parchment-elevated p-2 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
      />
    </label>
  );
}
