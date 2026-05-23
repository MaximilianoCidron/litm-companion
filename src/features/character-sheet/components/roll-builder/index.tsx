"use client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ScrollArea,
  Separator,
} from "@/shared/ui";
import {
  useRollBuilder,
  useRollBuilderExpanded,
} from "../../stores/roll-builder";
import { DesktopTrigger } from "./desktop-trigger";
import { DetailedActionPicker } from "./detailed-action-picker";
import { MightSelector } from "./might-selector";
import { MobileBar } from "./mobile-bar";
import { PowerSummary } from "./power-summary";
import { ReactingIndicator } from "./reacting-indicator";
import { ReactionToggle } from "./reaction-toggle";
import { RollButton } from "./roll-button";
import { StatusPicker } from "./status-picker";
import { TagPicker } from "./tag-picker";

function PanelBody() {
  return (
    <>
      <ReactingIndicator />
      <ReactionToggle />
      <DetailedActionPicker />
      <Separator />
      <TagPicker />
      <Separator />
      <StatusPicker />
      <Separator />
      <MightSelector />
    </>
  );
}

function PanelFooter() {
  return (
    <div className="flex flex-col gap-3 border-t border-mist-light p-3 dark:border-mist-dark">
      <PowerSummary />
      <RollButton />
    </div>
  );
}

export function RollPanel() {
  const expanded = useRollBuilderExpanded();
  const setExpanded = useRollBuilder((s) => s.setExpanded);

  return (
    <>
      <DesktopTrigger />
      <MobileBar />

      {/* Mobile bottom-sheet */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          aria-describedby={undefined}
          showClose
          className={
            "left-0 bottom-0 top-auto h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none md:hidden " +
            "transition-transform duration-300 ease-out " +
            "data-[state=closed]:translate-y-full data-[state=open]:translate-y-0"
          }
        >
          <div className="flex h-full flex-col">
            <DialogHeader>
              <DialogTitle>Roll</DialogTitle>
            </DialogHeader>
            <ScrollArea className="flex-1">
              <PanelBody />
            </ScrollArea>
            <PanelFooter />
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop right-slide drawer */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent
          aria-describedby={undefined}
          showClose
          className={
            "hidden md:flex md:flex-col " +
            "left-auto top-0 bottom-0 right-0 h-dvh w-80 lg:w-96 max-w-none " +
            "translate-x-0 translate-y-0 rounded-none rounded-l-2xl " +
            "border-l border-mist-light dark:border-mist-dark " +
            "transition-transform duration-300 ease-out " +
            "data-[state=closed]:translate-x-full data-[state=open]:translate-x-0"
          }
        >
          <DialogHeader>
            <DialogTitle>Roll</DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1">
            <PanelBody />
          </ScrollArea>
          <PanelFooter />
        </DialogContent>
      </Dialog>
    </>
  );
}
