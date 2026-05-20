"use client";
import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  toast,
} from "@/shared/ui";
import { createCharacter } from "../actions/create-character";

interface CreateCharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCharacterDialog({
  open,
  onOpenChange,
}: CreateCharacterDialogProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setName("");
    setNameError(null);
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNameError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Name is required.");
      return;
    }
    startTransition(async () => {
      const result = await createCharacter({ name: trimmed });
      if (result.ok) {
        toast.success("Hero created", {
          description: `${trimmed} is ready for the road.`,
        });
        onOpenChange(false);
        reset();
        router.push(`/characters/${result.data.id}`);
        router.refresh();
        return;
      }
      if (result.error.code === "VALIDATION") {
        const issue = result.error.issues?.find((i) => i.path[0] === "name");
        setNameError(issue?.message ?? "Invalid name.");
        return;
      }
      toast.error("Could not create hero", {
        description: result.error.message,
      });
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Forge a new hero</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <DialogBody className="flex flex-col gap-3">
            <label
              htmlFor="new-hero-name"
              className="flex flex-col gap-2 text-sm"
            >
              <span className="font-medium text-ink-muted dark:text-parchment-muted">
                Hero name
              </span>
              <Input
                id="new-hero-name"
                value={name}
                onChange={(e) => {
                  setName(e.currentTarget.value);
                  if (nameError) setNameError(null);
                }}
                placeholder="e.g. Brena of Saltmarch"
                autoFocus
                required
                disabled={pending}
                state={nameError ? "error" : "default"}
                aria-invalid={nameError ? true : undefined}
                aria-describedby={nameError ? "new-hero-name-error" : undefined}
              />
              {nameError ? (
                <span
                  id="new-hero-name-error"
                  role="alert"
                  className="text-sm text-crimson dark:text-crimson-dark"
                >
                  {nameError}
                </span>
              ) : null}
            </label>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || name.trim().length === 0}
            >
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
