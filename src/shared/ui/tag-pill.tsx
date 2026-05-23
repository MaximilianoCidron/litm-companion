"use client";
import * as React from "react";
import { Loader2, Lock, MoreVertical } from "lucide-react";
import { Flame, Leaf, Sparkles, Thorn } from "./tag-pill-icons";
import {
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./index";
import { cn } from "@/shared/lib/cn";

export type TagPolarity =
  | "power"
  | "weakness"
  | "story-helpful"
  | "story-hindering";

export type TagState = "active" | "scratched" | "burned";

export interface TagPillProps {
  polarity: TagPolarity;
  label: string;
  state?: TagState;
  /** Optional interactive handlers. Omit to render read-only. */
  onToggleScratch?: () => Promise<void>;
  onBurn?: () => Promise<void>;
  onRename?: (newName: string) => Promise<void>;
  onRemove?: () => Promise<void>;
  /** Story-tag only: toggle the camp-rest preservation flag. */
  onTogglePreserve?: () => Promise<void>;
  isPreserved?: boolean;
  disabled?: boolean;
  className?: string;
}

const polarityClasses: Record<TagPolarity, string> = {
  power:
    "bg-tag-power-soft text-tag-power-text border border-tag-power-base/40 " +
    "dark:bg-tag-power-soft-dark dark:text-tag-power-text-dark dark:border-tag-power-base/60",
  weakness:
    "bg-tag-weakness-soft text-tag-weakness-text border border-tag-weakness-base/40 " +
    "dark:bg-tag-weakness-soft-dark dark:text-tag-weakness-text-dark dark:border-tag-weakness-base/60",
  "story-helpful":
    "bg-tag-story-helpful text-tag-power-text border border-tag-power-base/30 " +
    "dark:bg-tag-power-soft-dark dark:text-tag-power-text-dark dark:border-tag-power-base/50",
  "story-hindering":
    "bg-tag-story-hindering text-tag-weakness-text border border-tag-weakness-base/30 " +
    "dark:bg-tag-weakness-soft-dark dark:text-tag-weakness-text-dark dark:border-tag-weakness-base/50",
};

const ariaPolarity: Record<TagPolarity, string> = {
  power: "power tag",
  weakness: "weakness tag",
  "story-helpful": "helpful story tag",
  "story-hindering": "hindering story tag",
};

function PolarityIcon({ polarity }: { polarity: TagPolarity }) {
  if (polarity === "power" || polarity === "story-helpful") {
    return <Sparkles className="h-4 w-4" aria-hidden="true" />;
  }
  return <Thorn className="h-4 w-4" aria-hidden="true" />;
}

function stateSuffix(state: TagState): string {
  if (state === "scratched") return ", scratched";
  if (state === "burned") return ", burned";
  return "";
}

function StateGlyph({ state }: { state: TagState }) {
  if (state === "burned") return <Flame className="h-4 w-4" aria-hidden="true" />;
  if (state === "scratched")
    return <Leaf className="h-4 w-4 opacity-50" aria-hidden="true" />;
  return null;
}

export function TagPill(props: TagPillProps) {
  const {
    polarity,
    label,
    state = "active",
    onToggleScratch,
    onBurn,
    onRename,
    onRemove,
    onTogglePreserve,
    isPreserved = false,
    disabled = false,
    className,
  } = props;

  const interactive = Boolean(
    onToggleScratch || onBurn || onRename || onRemove || onTogglePreserve,
  );

  if (!interactive) {
    return <ReadOnlyPill {...props} />;
  }

  return (
    <InteractivePill
      polarity={polarity}
      label={label}
      state={state}
      onToggleScratch={onToggleScratch}
      onBurn={onBurn}
      onRename={onRename}
      onRemove={onRemove}
      onTogglePreserve={onTogglePreserve}
      isPreserved={isPreserved}
      disabled={disabled}
      className={className}
    />
  );
}

function ReadOnlyPill({
  polarity,
  label,
  state = "active",
  isPreserved = false,
  className,
}: TagPillProps) {
  const stateClass =
    state === "scratched"
      ? "line-through opacity-60"
      : state === "burned"
        ? "opacity-40 italic border-dashed"
        : "";

  return (
    <span
      role="status"
      aria-label={`${ariaPolarity[polarity]}: ${label}${stateSuffix(state)}${
        isPreserved ? ", preserved" : ""
      }`}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-lg px-3 text-sm font-medium leading-none",
        polarityClasses[polarity],
        stateClass,
        className,
      )}
    >
      <PolarityIcon polarity={polarity} />
      <span>{label}</span>
      {isPreserved ? (
        <Lock className="h-3 w-3 text-ember" aria-hidden="true" />
      ) : null}
      <StateGlyph state={state} />
    </span>
  );
}

function InteractivePill({
  polarity,
  label,
  state = "active",
  onToggleScratch,
  onBurn,
  onRename,
  onRemove,
  onTogglePreserve,
  isPreserved = false,
  disabled,
  className,
}: TagPillProps) {
  const [pending, setPending] = React.useState(false);
  const [mode, setMode] = React.useState<"display" | "renaming">("display");
  const [draft, setDraft] = React.useState(label);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const isBurned = state === "burned";

  const canScratch = Boolean(onToggleScratch) && !isBurned && !disabled;
  const showBurnItem = Boolean(onBurn) && polarity === "power" && !isBurned;
  const showRenameItem = Boolean(onRename);
  const showRemoveItem = Boolean(onRemove);
  const showPreserveItem = Boolean(onTogglePreserve);

  const stateClass =
    state === "scratched"
      ? "line-through opacity-60"
      : isBurned
        ? "opacity-40 italic border-dashed"
        : "";

  const runWithPending = React.useCallback(
    async (fn: (() => Promise<void>) | undefined) => {
      if (!fn) return;
      setPending(true);
      try {
        await fn();
      } finally {
        setPending(false);
      }
    },
    [],
  );

  const startRename = () => {
    setDraft(label);
    setMode("renaming");
  };

  const cancelRename = () => {
    setDraft(label);
    setMode("display");
  };

  const commitRename = async () => {
    const trimmed = draft.trim();
    if (trimmed === "" || trimmed === label) {
      cancelRename();
      return;
    }
    if (!onRename) {
      cancelRename();
      return;
    }
    setPending(true);
    try {
      await onRename(trimmed);
      setMode("display");
    } catch {
      // Caller handles toast; revert local state.
      cancelRename();
    } finally {
      setPending(false);
    }
  };

  // Focus the rename input when entering renaming mode.
  React.useEffect(() => {
    if (mode === "renaming") {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [mode]);

  const onBodyClick = () => {
    if (!canScratch || pending || mode === "renaming") return;
    void runWithPending(onToggleScratch);
  };

  const ariaLabel = `${ariaPolarity[polarity]}: ${label}${stateSuffix(state)}${
    isPreserved ? ", preserved" : ""
  }`;

  return (
    <span
      className={cn(
        "inline-flex h-11 items-center gap-1 rounded-lg pl-3 text-sm font-medium leading-none",
        polarityClasses[polarity],
        stateClass,
        pending && "opacity-70 cursor-progress",
        className,
      )}
    >
      <PolarityIcon polarity={polarity} />
      {mode === "renaming" ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.currentTarget.value)}
          onBlur={() => void commitRename()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void commitRename();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelRename();
            }
          }}
          maxLength={60}
          aria-label={`Rename ${label}`}
          disabled={pending}
          className="min-w-[6ch] flex-1 bg-transparent text-inherit font-inherit border-0 px-0 focus:outline-none"
        />
      ) : canScratch ? (
        <button
          type="button"
          onClick={onBodyClick}
          disabled={pending}
          aria-label={ariaLabel}
          className={cn(
            "inline-flex items-center gap-2 bg-transparent text-inherit",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember rounded",
          )}
        >
          <span>{label}</span>
        </button>
      ) : (
        <span aria-label={ariaLabel}>{label}</span>
      )}
      {isPreserved ? (
        <Lock className="h-3 w-3 text-ember" aria-hidden="true" />
      ) : null}
      <StateGlyph state={state} />
      <PillMenu
        label={label}
        pending={pending}
        disabled={disabled || mode === "renaming"}
        showRename={showRenameItem}
        showBurn={showBurnItem}
        showRemove={showRemoveItem}
        showPreserve={showPreserveItem}
        isPreserved={isPreserved}
        onRename={startRename}
        onBurn={onBurn ? () => runWithPending(onBurn) : undefined}
        onRemove={onRemove ? () => runWithPending(onRemove) : undefined}
        onTogglePreserve={
          onTogglePreserve ? () => runWithPending(onTogglePreserve) : undefined
        }
      />
    </span>
  );
}

interface PillMenuProps {
  label: string;
  pending: boolean;
  disabled: boolean;
  showRename: boolean;
  showBurn: boolean;
  showRemove: boolean;
  showPreserve: boolean;
  isPreserved: boolean;
  onRename: () => void;
  onBurn?: () => Promise<void>;
  onRemove?: () => Promise<void>;
  onTogglePreserve?: () => Promise<void>;
}

function PillMenu({
  label,
  pending,
  disabled,
  showRename,
  showBurn,
  showRemove,
  showPreserve,
  isPreserved,
  onRename,
  onBurn,
  onRemove,
  onTogglePreserve,
}: PillMenuProps) {
  const anyItem = showRename || showBurn || showRemove || showPreserve;
  if (!anyItem) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          disabled={disabled || pending}
          aria-label={`Options for ${label}`}
          className={cn(
            "ml-1 inline-flex h-11 w-9 items-center justify-center rounded-r-lg",
            "hover:bg-ink-base/5 dark:hover:bg-parchment-elevated/10",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {showRename ? (
          <DropdownMenuItem onSelect={onRename}>Rename</DropdownMenuItem>
        ) : null}
        {showPreserve && onTogglePreserve ? (
          <DropdownMenuItem onSelect={() => void onTogglePreserve()}>
            {isPreserved ? "Discard at next camp" : "Preserve when camping"}
          </DropdownMenuItem>
        ) : null}
        {showBurn && onBurn ? (
          <ConfirmDialog
            trigger={
              <DropdownMenuItem
                onSelect={(e) => {
                  // Prevent the menu from auto-closing the trigger before the
                  // dialog mounts — Radix re-targets focus otherwise.
                  e.preventDefault();
                }}
              >
                Burn
              </DropdownMenuItem>
            }
            title="Burn this tag?"
            description={
              <>
                Burning <strong>{label}</strong> gives +3 Power once. You
                won&apos;t be able to use it again until you rest.
              </>
            }
            confirmLabel="Burn"
            variant="destructive"
            onConfirm={onBurn}
          />
        ) : null}
        {showRemove && onRemove ? (
          <ConfirmDialog
            trigger={
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                }}
              >
                Remove
              </DropdownMenuItem>
            }
            title="Remove this tag?"
            description={
              <>
                <strong>{label}</strong> will be removed from this theme. This
                can&apos;t be undone.
              </>
            }
            confirmLabel="Remove"
            variant="destructive"
            onConfirm={onRemove}
          />
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
