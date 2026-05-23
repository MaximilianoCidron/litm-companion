"use client";

import { useState } from "react";
import { Tent } from "lucide-react";
import { Button } from "@/shared/ui";
import { MakeCampDialog } from "./make-camp-dialog";

export function MakeCampButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Tent className="h-4 w-4" aria-hidden="true" />
        Make camp
      </Button>
      <MakeCampDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
