"use client";
import { useState, useTransition, type FormEvent } from "react";
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
import { createCharacterPlaceholderAction } from "../actions/create-character";

interface CreateCharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCharacterDialog({
  open,
  onOpenChange,
}: CreateCharacterDialogProps) {
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    startTransition(async () => {
      await createCharacterPlaceholderAction(trimmed);
      toast.success("Coming soon", {
        description: "Character creation lands with the data layer.",
      });
      setName("");
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Forge a new hero</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit}>
          <DialogBody className="flex flex-col gap-3">
            <label htmlFor="new-hero-name" className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink-muted dark:text-parchment-muted">
                Hero name
              </span>
              <Input
                id="new-hero-name"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="e.g. Brena of Saltmarch"
                autoFocus
                required
              />
            </label>
          </DialogBody>
          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending || name.trim().length === 0}>
              {pending ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
