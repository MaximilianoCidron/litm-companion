"use client";
import * as React from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui";
import {
  formatThemeType,
  themeTypesForMightLevel,
  type MightLevel,
  type ThemeType,
} from "../../../schemas";

interface DialogFormShellProps {
  trigger: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  submitLabel: string;
  submitDisabled?: boolean;
  submitVariant?: "primary" | "destructive";
  onSubmit: () => Promise<{ ok: boolean }>;
  children: React.ReactNode;
}

export function DialogFormShell({
  trigger,
  title,
  description,
  submitLabel,
  submitDisabled = false,
  submitVariant = "primary",
  onSubmit,
  children,
}: DialogFormShellProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, setPending] = React.useState(false);

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (pending || submitDisabled) return;
    setPending(true);
    try {
      const result = await onSubmit();
      if (result.ok) {
        setOpen(false);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        {...(description ? {} : { "aria-describedby": undefined })}
      >
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {description ? (
            <DialogDescription className="px-6 pt-4 font-serif text-ink-muted dark:text-parchment-muted">
              {description}
            </DialogDescription>
          ) : null}
          <DialogBody className="flex flex-col gap-4">{children}</DialogBody>
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
              type="submit"
              variant={submitVariant === "destructive" ? "destructive" : "primary"}
              disabled={pending || submitDisabled}
            >
              {pending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface TypeOptionPickerProps {
  value: ThemeType | null;
  onChange: (next: ThemeType) => void;
  /** Constrain to one might level; omit to show all three groups. */
  mightLevel?: MightLevel;
  placeholder?: string;
  disabled?: boolean;
}

const MIGHT_ORDER: MightLevel[] = ["origin", "adventure", "greatness"];
const MIGHT_LABEL: Record<MightLevel, string> = {
  origin: "Origin",
  adventure: "Adventure",
  greatness: "Greatness",
};

export function TypeOptionPicker({
  value,
  onChange,
  mightLevel,
  placeholder = "Choose a type…",
  disabled,
}: TypeOptionPickerProps) {
  const display = value
    ? (() => {
        const { label, mightLabel } = formatThemeType(value);
        return `${label} · ${mightLabel}`;
      })()
    : placeholder;

  const levels = mightLevel ? [mightLevel] : MIGHT_ORDER;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="justify-between font-sans w-full"
        >
          <span className={value ? undefined : "text-ink-subtle dark:text-parchment-subtle"}>
            {display}
          </span>
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={6} className="min-w-[20rem]">
        {levels.map((lvl, idx) => (
          <React.Fragment key={lvl}>
            {idx > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel>{MIGHT_LABEL[lvl]}</DropdownMenuLabel>
            {themeTypesForMightLevel(lvl).map((type) => {
              const isCurrent = type === value;
              const { label } = formatThemeType(type);
              return (
                <DropdownMenuItem
                  key={type}
                  onSelect={() => {
                    if (!isCurrent) onChange(type);
                  }}
                  className={
                    isCurrent
                      ? "bg-parchment-soft font-medium dark:bg-ink-soft"
                      : undefined
                  }
                >
                  {label}
                </DropdownMenuItem>
              );
            })}
          </React.Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
