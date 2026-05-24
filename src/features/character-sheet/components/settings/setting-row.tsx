"use client";
import { cn } from "@/shared/lib/cn";
import type { ReactNode } from "react";

interface SettingRowProps {
  label: string;
  description?: string;
  control: ReactNode;
}

export function SettingRow({ label, description, control }: SettingRowProps) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <p className="font-display text-sm text-ink-base dark:text-parchment-base">
          {label}
        </p>
        {description ? (
          <p className="mt-0.5 text-xs text-ink-muted dark:text-parchment-muted">
            {description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange(next: boolean): void;
  ariaLabel: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, ariaLabel, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked
          ? "bg-ember"
          : "bg-mist-light dark:bg-mist-dark",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-block h-5 w-5 transform rounded-full bg-parchment-elevated shadow transition-transform",
          checked ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}

interface RadioOptionsProps<T extends string> {
  value: T;
  onChange(next: T): void;
  options: ReadonlyArray<{ value: T; label: string }>;
  ariaLabel: string;
}

export function RadioOptions<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
}: RadioOptionsProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="inline-flex gap-1">
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded px-2.5 py-1 text-xs transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
              selected
                ? "bg-ember text-parchment-elevated"
                : "bg-parchment-soft text-ink-muted hover:bg-parchment-elevated dark:bg-ink-soft dark:text-parchment-muted dark:hover:bg-ink-elevated",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
