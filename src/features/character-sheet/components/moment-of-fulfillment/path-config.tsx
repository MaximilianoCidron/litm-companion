"use client";

import type {
  Character,
  MomentOfFulfillmentPath,
} from "../../schemas";
import type { MomentOfFulfillmentPayload } from "./helpers";

interface PathConfigProps {
  path: MomentOfFulfillmentPath;
  character: Character;
  payload: MomentOfFulfillmentPayload;
  onChange: (next: MomentOfFulfillmentPayload) => void;
}

export function PathConfig({
  path,
  character,
  payload,
  onChange,
}: PathConfigProps) {
  const set = <K extends keyof MomentOfFulfillmentPayload>(
    key: K,
    value: MomentOfFulfillmentPayload[K],
  ) => onChange({ ...payload, [key]: value });

  if (path === "retire") {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-crimson/40 bg-crimson/10 p-3 text-sm text-ink-base dark:text-parchment-base">
          <p className="font-display text-sm uppercase tracking-wider text-crimson dark:text-crimson-dark">
            Final road
          </p>
          <p className="mt-1">
            This will archive {character.identity.name || "this hero"}. They
            won&apos;t make rolls, camp, or advance. The sheet remains
            viewable but read-only.
          </p>
        </div>
        <LongField
          label="Final words (optional)"
          maxLength={500}
          value={payload.retireDescription}
          onChange={(v) => set("retireDescription", v)}
        />
      </div>
    );
  }

  if (path === "reforge") {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-lg border border-ember/40 bg-ember/10 p-3 text-xs text-ink-base dark:text-parchment-base">
          Themes, tags, statuses, and backpack will be discarded. Quintessences
          ({character.progression.quintessences.length}) and relationships ({
            character.fellowship.relationships.length
          }) survive.
        </div>
        <ShortField
          label="New name (optional)"
          maxLength={60}
          placeholder={character.identity.name || "Same as before"}
          value={payload.reforgeNewName}
          onChange={(v) => set("reforgeNewName", v)}
        />
        <ShortField
          label="New concept (optional)"
          maxLength={120}
          placeholder={character.identity.concept || "Same as before"}
          value={payload.reforgeNewConcept}
          onChange={(v) => set("reforgeNewConcept", v)}
        />
        <LongField
          label="How does the change feel? (optional)"
          maxLength={500}
          value={payload.reforgeDescription}
          onChange={(v) => set("reforgeDescription", v)}
        />
      </div>
    );
  }

  if (path === "gainQuintessence") {
    return (
      <div className="flex flex-col gap-3">
        <ShortField
          label="Quintessence"
          maxLength={120}
          placeholder="e.g., Eyes that see through illusion"
          value={payload.quintessenceText}
          onChange={(v) => set("quintessenceText", v)}
          required
        />
        <LongField
          label="Origin story (optional)"
          maxLength={500}
          value={payload.quintessenceDescription}
          onChange={(v) => set("quintessenceDescription", v)}
        />
      </div>
    );
  }

  if (path === "shakeWorld") {
    return (
      <LongField
        label="How does the world shift?"
        maxLength={500}
        value={payload.shakeWorldDescription}
        onChange={(v) => set("shakeWorldDescription", v)}
        placeholder="e.g., The eternal storm over the spire breaks. The high lords lose their throne."
        required
      />
    );
  }

  if (path === "speakWordsEternal") {
    return (
      <LongField
        label="What endures?"
        maxLength={500}
        value={payload.speakWordsEternalDescription}
        onChange={(v) => set("speakWordsEternalDescription", v)}
        placeholder="e.g., A blade that always returns to its kin's hand."
        required
      />
    );
  }

  return (
    <LongField
      label="What truth surfaces?"
      maxLength={500}
      value={payload.unearthTruthsDescription}
      onChange={(v) => set("unearthTruthsDescription", v)}
      placeholder="e.g., The Vault was sealed by the heroes' own ancestors."
      required
    />
  );
}

interface ShortFieldProps {
  label: string;
  maxLength: number;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}

function ShortField({
  label,
  maxLength,
  value,
  onChange,
  placeholder,
  required,
}: ShortFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        {label}
        {required ? " *" : ""}
      </span>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="h-10 rounded-lg border border-mist-light bg-parchment-elevated px-3 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
      />
    </label>
  );
}

function LongField({
  label,
  maxLength,
  value,
  onChange,
  placeholder,
  required,
}: ShortFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
        {label}
        {required ? " *" : ""}
      </span>
      <textarea
        value={value}
        maxLength={maxLength}
        rows={3}
        placeholder={placeholder}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="rounded-lg border border-mist-light bg-parchment-elevated p-2 text-sm text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base"
      />
      <span className="self-end text-xs text-ink-subtle dark:text-parchment-subtle">
        {value.length}/{maxLength}
      </span>
    </label>
  );
}
