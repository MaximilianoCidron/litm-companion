"use client";

import { Separator } from "@/shared/ui";
import { IdentitySection } from "./identity-section";
import { TagsSection } from "./tags-section";
import { StatusesSection } from "./statuses-section";
import { LimitsSection } from "./limits-section";
import { ThreatsSection } from "./threats-section";
import { NotesSection } from "./notes-section";
import { DeleteSection } from "./delete-section";

export { ChallengeEditor };

function ChallengeEditor() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 p-4 md:p-8">
      <IdentitySection />
      <Separator />
      <TagsSection />
      <Separator />
      <StatusesSection />
      <Separator />
      <LimitsSection />
      <Separator />
      <ThreatsSection />
      <Separator />
      <NotesSection />
      <Separator />
      <DeleteSection />
    </div>
  );
}
