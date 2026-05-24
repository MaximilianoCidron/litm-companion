"use client";
import { Card, Skeleton, Track } from "@/shared/ui";
import { useCharacter } from "../CharacterProvider";
import { AvatarUploader } from "../avatar/avatar-uploader";
import { CampaignBadge } from "../campaign/campaign-badge";
import { CharacterHeaderMenu } from "../character-header-menu";
import { MomentOfFulfillmentBadge } from "../moment-of-fulfillment";
import { MakeCampButton } from "../camp/make-camp-button";
import { PresenceDot } from "../presence/presence-dot";
import { usePresenceOne } from "../../hooks/use-presence";

export function HeroSection() {
  const { character, role, canEdit, isRetired } = useCharacter();
  const { identity, progression, fellowship } = character;
  const hasRelationships = fellowship.relationships.length > 0;
  const hasQuintessences = progression.quintessences.length > 0;
  // Owner-only — GM can't trigger another player's Moment of Fulfillment.
  const showMomentOfFulfillment =
    progression.promise === 5 && role === "owner" && !isRetired;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <Card>
        <Card.Header>
          <h3 className="font-display text-base tracking-tight">Hero</h3>
          <CharacterHeaderMenu />
        </Card.Header>
        <Card.Body className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <AvatarUploader
              characterId={character.id}
              ownerUid={character.userId}
              avatarUrl={
                character.avatar?.mainUrl ?? identity.avatarUrl ?? null
              }
              characterName={identity.name}
              size="lg"
              canEdit={role === "owner" && !isRetired}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
                Name
              </span>
              <h2 className="font-display text-2xl tracking-tight text-ink-base dark:text-parchment-base">
                {identity.name || "Unnamed hero"}
              </h2>
              {identity.pronouns ? (
                <span className="text-sm text-ink-muted dark:text-parchment-muted">
                  {identity.pronouns}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Concept
            </span>
            <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
              {identity.concept || "—"}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Player
            </span>
            <PlayerLine playerNameFallback={identity.playerName} />
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Companions
            </span>
            {hasRelationships ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-ink-muted dark:text-parchment-muted">
                    <th className="pb-2 font-medium">Companion</th>
                    <th className="pb-2 font-medium">Relationship</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist-light dark:divide-mist-dark">
                  {fellowship.relationships.map((rel) => (
                    <tr key={rel.id}>
                      <td className="py-3 text-ink-base dark:text-parchment-base">
                        {rel.companionName}
                      </td>
                      <td className="py-3 font-serif italic text-ink-muted dark:text-parchment-muted">
                        {rel.relationshipTag || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm italic text-ink-subtle dark:text-parchment-subtle">
                No companions yet.
              </p>
            )}
          </div>

          <CampaignBadge />

          <div className="flex flex-col gap-2">
            <Track total={5} filled={progression.promise} label="Promise" />
            {showMomentOfFulfillment ? (
              <div className="mt-2">
                <MomentOfFulfillmentBadge />
              </div>
            ) : null}
            {canEdit ? (
              <div className="mt-2 self-start">
                <MakeCampButton />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
              Quintessences
            </span>
            {hasQuintessences ? (
              <ul className="flex flex-col gap-2 text-sm text-ink-base dark:text-parchment-base">
                {progression.quintessences.map((q, i) => (
                  <li key={i} className="font-serif italic">
                    {q}
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-3/5" />
              </ul>
            )}
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}

function PlayerLine({ playerNameFallback }: { playerNameFallback: string }) {
  const { character, role } = useCharacter();
  // GM viewing another player's sheet benefits from knowing whether the
  // player is online to coordinate. Owner viewing their own sheet sees no
  // extra signal — they already know.
  const showPresence = role === "gm";
  const { doc, isOnline } = usePresenceOne(
    showPresence ? character.userId : null,
  );
  const displayName =
    doc?.displayName || playerNameFallback || "—";

  if (!showPresence) {
    return (
      <span className="text-sm text-ink-base dark:text-parchment-base">
        {playerNameFallback || "—"}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 text-sm text-ink-base dark:text-parchment-base">
      <PresenceDot uid={character.userId} />
      <span>{displayName}</span>
      <span className="text-xs text-ink-muted dark:text-parchment-muted">
        · {isOnline ? "online" : "offline"}
      </span>
    </span>
  );
}
