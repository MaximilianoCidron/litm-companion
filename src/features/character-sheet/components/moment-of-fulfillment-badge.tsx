"use client";
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
} from "@/shared/ui";

// TODO(prompt-future): wire the six Moment-of-Fulfillment options into real actions.
export function MomentOfFulfillmentBadge() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="fx-celebrate ring-2 ring-ember/40"
        >
          Moment of Fulfillment
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You&apos;ve reached a Moment of Fulfillment</DialogTitle>
        </DialogHeader>
        <DialogDescription className="px-6 pt-4 font-serif text-ink-muted dark:text-parchment-muted">
          Your Promise track is full. With your Narrator, you can shape what
          comes next — retiring this hero, being reforged, gaining a deeper
          truth, or other consequential paths.
        </DialogDescription>
        <DialogBody>
          <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
            Moment-of-Fulfillment options are coming soon. For now, mark this
            moment at the table.
          </p>
        </DialogBody>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button type="button" variant="ghost">
              Close
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
