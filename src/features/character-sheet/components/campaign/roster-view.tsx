// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import Link from "next/link";
import { MoreVertical } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Card,
  ConfirmDialog,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Track,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { useRoster } from "../RosterProvider";
import { useCampaign } from "../CampaignProvider";
import { kickFromCampaign } from "../../actions";
import { usePresence } from "../../hooks/use-presence";
import { PresenceDot } from "../presence/presence-dot";
import type { CampaignId, Character } from "../../schemas";

interface RosterViewProps {
  campaignId: CampaignId;
}

export function RosterView({ campaignId }: RosterViewProps) {
  const characters = useRoster();
  const campaign = useCampaign();
  const role =
    campaign.status === "live" || campaign.status === "error"
      ? campaign.role
      : null;
  const isGm = role === "gm";

  const gmUid =
    campaign.status === "live"
      ? campaign.campaign.gmUid
      : campaign.status === "error"
        ? (campaign.campaign?.gmUid ?? null)
        : null;
  const allUids = Array.from(
    new Set(
      characters.map((c) => c.userId).concat(gmUid ? [gmUid] : []),
    ),
  );
  const presenceMap = usePresence(allUids);
  const onlineCount = Array.from(presenceMap.values()).filter(
    (p) => p.isOnline,
  ).length;

  return (
    <Card>
      <Card.Header title="Roster">
        {allUids.length > 0 ? (
          <span className="font-display text-xs uppercase tracking-wider text-ink-muted dark:text-parchment-muted">
            {onlineCount} of {allUids.length} online
          </span>
        ) : null}
      </Card.Header>
      <Card.Body>
        {characters.length === 0 ? (
          <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
            No heroes in the fellowship yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {characters.map((c) => (
              <RosterRow
                key={c.id}
                character={c}
                isGm={isGm}
                campaignId={campaignId}
              />
            ))}
          </ul>
        )}
      </Card.Body>
    </Card>
  );
}

function activeStatusLabel(character: Character): string | null {
  const active = character.statuses[0];
  if (!active) return null;
  return `${active.name} · ${active.tier}`;
}

function RosterRow({
  character,
  isGm,
  campaignId,
}: {
  character: Character;
  isGm: boolean;
  campaignId: CampaignId;
}) {
  const callAction = useActionWithToast();
  const status = activeStatusLabel(character);

  return (
    <li className="flex items-center gap-3 rounded-lg border border-mist-light p-3 dark:border-mist-dark">
      <Link
        href={`/characters/${character.id}`}
        className="flex flex-1 items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ember rounded"
      >
        <Avatar className="h-10 w-10">
          {character.identity.avatarUrl ? (
            <AvatarImage
              src={character.identity.avatarUrl}
              alt={character.identity.name}
            />
          ) : null}
          <AvatarFallback>
            {character.identity.name.slice(0, 1).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-1 flex-col">
          <span className="inline-flex items-center gap-2 font-display text-ink-base dark:text-parchment-base">
            <PresenceDot uid={character.userId} />
            {character.identity.name || "Unnamed hero"}
          </span>
          {character.identity.concept ? (
            <span className="font-serif text-xs italic text-ink-muted dark:text-parchment-muted">
              {character.identity.concept}
            </span>
          ) : null}
          <div className="mt-1 flex items-center gap-3 text-xs text-ink-subtle dark:text-parchment-subtle">
            <Track total={5} filled={character.progression.promise} />
            {status ? <span>● {status}</span> : null}
          </div>
        </div>
      </Link>
      {isGm ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={`Options for ${character.identity.name}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded text-ink-muted hover:bg-parchment-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-ember dark:text-parchment-muted dark:hover:bg-ink-elevated"
            >
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ConfirmDialog
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  Kick from campaign
                </DropdownMenuItem>
              }
              title="Kick this hero?"
              description={
                <>
                  <strong>{character.identity.name}</strong> will be removed
                  from the fellowship roster.
                </>
              }
              confirmLabel="Kick"
              variant="destructive"
              onConfirm={async () => {
                await callAction(
                  kickFromCampaign({
                    campaignId,
                    characterId: character.id,
                  }),
                  { onSuccess: "Hero removed" },
                );
              }}
            />
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </li>
  );
}
