"use client";
import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { Button } from "@/shared/ui";
import { useCampaign } from "../CampaignProvider";
import { useCharacter } from "../CharacterProvider";
import { CreateCampaignDialog } from "./create-campaign-dialog";

export function CampaignBadge() {
  const campaign = useCampaign();
  const { character, role } = useCharacter();
  const canCreate = role === "owner";

  if (campaign.status === "live") {
    return (
      <Link
        href={`/campaigns/${campaign.campaign.id}`}
        className="inline-flex items-center gap-2 self-start rounded-full bg-parchment-soft px-3 py-1 text-xs font-medium text-ink-muted hover:text-ember hover:underline dark:bg-ink-soft dark:text-parchment-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ember"
      >
        <Users className="h-3.5 w-3.5" aria-hidden="true" />
        {campaign.campaign.name}
      </Link>
    );
  }

  if (!canCreate) {
    return (
      <span className="inline-flex items-center gap-2 self-start rounded-full bg-parchment-soft px-3 py-1 text-xs italic text-ink-subtle dark:bg-ink-soft dark:text-parchment-subtle">
        No fellowship
      </span>
    );
  }

  return (
    <CreateCampaignDialog
      characterId={character.id}
      trigger={
        <Button variant="ghost" size="sm" className="self-start">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Start a fellowship
        </Button>
      }
    />
  );
}
