"use client";
import * as React from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import {
  useDebouncedFieldSave,
  type SaveState,
} from "@/shared/hooks/use-debounced-field-save";
import type { ActionResult } from "@/shared/auth";

export interface EditableFieldProps {
  value: string;
  onCommit: (val: string) => Promise<ActionResult<unknown>>;
  placeholder?: string;
  multiline?: boolean;
  maxLength?: number;
  className?: string;
  disabled?: boolean;
  ariaLabel: string;
  debounceMs?: number;
  /**
   * Optional preset for the kind of text being edited. `display` uses Cinzel
   * for headings; `body` uses Inter for default inputs; `prose` uses Spectral
   * for narrative blocks. Callers can override via className.
   */
  fontPreset?: "display" | "body" | "prose";
}

function StatusIndicator({
  state,
  errorMsg,
}: {
  state: SaveState;
  errorMsg: string | null;
}) {
  if (state === "idle") return null;
  if (state === "pending") {
    return (
      <span
        aria-label="Unsaved changes"
        className="h-2 w-2 shrink-0 rounded-full bg-ink-subtle dark:bg-parchment-subtle"
      />
    );
  }
  if (state === "saving") {
    return (
      <Loader2
        aria-label="Saving"
        className="h-4 w-4 shrink-0 animate-spin text-ink-subtle dark:text-parchment-subtle"
      />
    );
  }
  if (state === "saved") {
    return (
      <Check
        aria-label="Saved"
        className="h-4 w-4 shrink-0 text-moss dark:text-moss-dark"
      />
    );
  }
  return (
    <AlertCircle
      aria-label={errorMsg ?? "Save failed"}
      className="h-4 w-4 shrink-0 text-crimson dark:text-crimson-dark"
    />
  );
}

export function EditableField({
  value: upstream,
  onCommit,
  placeholder,
  multiline = false,
  maxLength,
  className,
  disabled = false,
  ariaLabel,
  debounceMs = 800,
  fontPreset = "body",
}: EditableFieldProps) {
  const { value, setValue, state, errorMsg } = useDebouncedFieldSave({
    value: upstream,
    save: onCommit,
    debounceMs,
  });

  const fontClass =
    fontPreset === "display"
      ? "font-display"
      : fontPreset === "prose"
        ? "font-serif"
        : "font-sans";

  const baseInput = cn(
    "w-full bg-transparent border-0 border-b px-1 py-1",
    "text-ink-base dark:text-parchment-base",
    "placeholder:text-ink-subtle dark:placeholder:text-parchment-subtle",
    "focus:outline-none focus:border-ember",
    "disabled:opacity-60 disabled:cursor-not-allowed",
    state === "error"
      ? "border-crimson dark:border-crimson-dark"
      : "border-mist-light dark:border-mist-dark",
    fontClass,
    className,
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="relative flex items-center gap-2">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-invalid={state === "error" || undefined}
            rows={3}
            className={cn(baseInput, "resize-y min-h-20")}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled}
            aria-label={ariaLabel}
            aria-invalid={state === "error" || undefined}
            className={baseInput}
          />
        )}
        <span className="absolute right-2 top-1/2 -translate-y-1/2">
          <StatusIndicator state={state} errorMsg={errorMsg} />
        </span>
      </div>
      {state === "error" && errorMsg ? (
        <span
          role="alert"
          className="text-xs text-crimson dark:text-crimson-dark"
        >
          {errorMsg}
        </span>
      ) : null}
    </div>
  );
}
