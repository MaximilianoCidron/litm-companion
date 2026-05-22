// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button, Card } from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { cn } from "@/shared/lib/cn";
import { redeemInvitation } from "../../actions";
import {
  CharacterId,
  type CharacterSummary,
  type Invitation,
} from "../../schemas";

interface RedeemInvitationViewProps {
  invitation: Invitation;
  characters: CharacterSummary[];
}

export function RedeemInvitationView({
  invitation,
  characters,
}: RedeemInvitationViewProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const callAction = useActionWithToast();
  const router = useRouter();

  const isExpired =
    new Date(invitation.expiresAt).getTime() <= Date.now();

  if (invitation.status === "consumed") {
    return (
      <Shell campaignName={invitation.campaignName}>
        <Card>
          <Card.Body className="flex flex-col items-center gap-3 text-center">
            <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
              This invite has already been used.
            </p>
            <Link
              href="/campaigns"
              className="text-sm font-display uppercase tracking-wider text-ember hover:underline"
            >
              See your fellowships →
            </Link>
          </Card.Body>
        </Card>
      </Shell>
    );
  }

  if (invitation.status === "revoked") {
    return (
      <Shell campaignName={invitation.campaignName}>
        <Card>
          <Card.Body className="flex flex-col items-center gap-3 text-center">
            <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
              This invite was revoked.
            </p>
            <Link
              href="/dashboard"
              className="text-sm font-display uppercase tracking-wider text-ember hover:underline"
            >
              Back to dashboard
            </Link>
          </Card.Body>
        </Card>
      </Shell>
    );
  }

  if (isExpired) {
    return (
      <Shell campaignName={invitation.campaignName}>
        <Card>
          <Card.Body className="flex flex-col items-center gap-3 text-center">
            <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
              This invite has expired.
            </p>
            <Link
              href="/dashboard"
              className="text-sm font-display uppercase tracking-wider text-ember hover:underline"
            >
              Back to dashboard
            </Link>
          </Card.Body>
        </Card>
      </Shell>
    );
  }

  if (characters.length === 0) {
    return (
      <Shell campaignName={invitation.campaignName}>
        <Card>
          <Card.Body className="flex flex-col items-center gap-3 text-center">
            <p className="font-serif italic text-ink-muted dark:text-parchment-muted">
              You don&apos;t have any heroes yet. Create one before joining a
              fellowship.
            </p>
            <Link
              href="/dashboard?createCharacter=1"
              className="text-sm font-display uppercase tracking-wider text-ember hover:underline"
            >
              Go to dashboard →
            </Link>
          </Card.Body>
        </Card>
      </Shell>
    );
  }

  const submit = () => {
    if (!selected) return;
    startTransition(async () => {
      const result = await callAction(
        redeemInvitation({
          invitationId: invitation.id,
          characterId: CharacterId.parse(selected),
        }),
        { onSuccess: "Joined the fellowship" },
      );
      if (result) {
        router.push(`/campaigns/${result.joinedCampaignId}`);
      }
    });
  };

  return (
    <Shell campaignName={invitation.campaignName}>
      <Card>
        <Card.Body className="flex flex-col gap-4">
          <p className="font-serif text-ink-muted dark:text-parchment-muted">
            Choose a hero to bring into <strong>{invitation.campaignName}</strong>.
          </p>
          <ul
            className="flex flex-col gap-2"
            role="radiogroup"
            aria-label="Choose a hero"
          >
            {characters.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected === c.id}
                  onClick={() => setSelected(c.id)}
                  disabled={pending}
                  className={cn(
                    "w-full rounded border px-3 py-2 text-left transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ember",
                    selected === c.id
                      ? "border-ember bg-ember/10"
                      : "border-mist-light hover:border-ember/60 dark:border-mist-dark",
                  )}
                >
                  <span className="block font-display text-sm">
                    {c.name || "Unnamed hero"}
                  </span>
                  {c.concept ? (
                    <span className="block font-serif text-xs italic text-ink-muted dark:text-parchment-muted">
                      {c.concept}
                    </span>
                  ) : null}
                  {c.campaignName ? (
                    <span className="block text-xs text-ink-subtle dark:text-parchment-subtle">
                      Already in {c.campaignName}
                    </span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
          <Button
            variant="primary"
            size="lg"
            disabled={pending || !selected}
            onClick={submit}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : null}
            Join fellowship
          </Button>
        </Card.Body>
      </Card>
    </Shell>
  );
}

function Shell({
  campaignName,
  children,
}: {
  campaignName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6 md:p-10">
      <header className="text-center">
        <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
          Fellowship invitation
        </span>
        <h1 className="font-display text-3xl text-ink-base dark:text-parchment-base">
          {campaignName}
        </h1>
      </header>
      {children}
    </div>
  );
}
