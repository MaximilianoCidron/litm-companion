"use client";

import { useState } from "react";
import { Button } from "@/shared/ui";
import { useCharacter } from "../CharacterProvider";
import { MomentOfFulfillmentDialog } from "./resolution-dialog";

/**
 * Renders only when the active character is owner-controlled, active, and
 * has a full Promise track. GM cannot see this trigger.
 */
export function MomentOfFulfillmentBadge() {
  const { character, role, isRetired } = useCharacter();
  const [open, setOpen] = useState(false);

  if (
    character.progression.promise !== 5 ||
    role !== "owner" ||
    isRetired
  ) {
    return null;
  }

  return (
    <>
      <Button
        type="button"
        variant="primary"
        size="sm"
        className="fx-celebrate ring-2 ring-ember/40"
        onClick={() => setOpen(true)}
      >
        Moment of Fulfillment
      </Button>
      <MomentOfFulfillmentDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
