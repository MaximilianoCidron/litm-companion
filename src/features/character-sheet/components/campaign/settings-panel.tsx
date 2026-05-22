// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { LogOut, UserCog } from "lucide-react";
import {
  Button,
  Card,
  ConfirmDialog,
  EditableField,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/ui";
import { useActionWithToast } from "@/shared/hooks/use-action-with-toast";
import { leaveCampaign, renameCampaign } from "../../actions";
import { useRoster } from "../RosterProvider";
import type { Campaign } from "../../schemas";
import { TransferGmDialog } from "./transfer-gm-dialog";

interface SettingsPanelProps {
  campaign: Campaign;
  role: "gm" | "member";
  currentUid: string;
}

export function SettingsPanel({
  campaign,
  role,
  currentUid,
}: SettingsPanelProps) {
  const callAction = useActionWithToast();
  const router = useRouter();
  const characters = useRoster();
  const isGm = role === "gm";

  const onRename = useCallback(
    (name: string) => renameCampaign({ campaignId: campaign.id, name }),
    [campaign.id],
  );

  // A non-GM caller can have multiple characters in this fellowship. Leaving
  // the campaign on their behalf removes the first one — the v1 simplification
  // matches the existing /characters page leave flow. Multi-character leave
  // controls land with the GM dashboard.
  const myCharacter = characters.find((c) => c.userId === currentUid) ?? null;

  const leaveDisabledReason = isGm
    ? "Transfer the GM role before leaving."
    : myCharacter
      ? null
      : "No hero of yours is in this fellowship.";

  return (
    <Card>
      <Card.Header title="Settings" />
      <Card.Body className="flex flex-col gap-4">
        {isGm ? (
          <>
            <div className="flex flex-col gap-1">
              <span className="font-display text-xs uppercase tracking-wider text-ink-subtle dark:text-parchment-subtle">
                Campaign name
              </span>
              <EditableField
                value={campaign.name}
                onCommit={onRename}
                ariaLabel="Campaign name"
                maxLength={80}
              />
            </div>
            <TransferGmDialog
              campaign={campaign}
              characters={characters}
              trigger={
                <Button variant="ghost" size="sm" className="self-start">
                  <UserCog className="h-4 w-4" aria-hidden="true" />
                  Transfer GM role
                </Button>
              }
            />
          </>
        ) : null}

        {leaveDisabledReason ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled
                  className="self-start"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Leave campaign
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>{leaveDisabledReason}</TooltipContent>
          </Tooltip>
        ) : (
          <ConfirmDialog
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="self-start text-crimson hover:bg-crimson/10 dark:text-crimson-dark"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Leave campaign
              </Button>
            }
            title="Leave this fellowship?"
            description={
              <>
                Your hero will be removed from the roster. You can rejoin via a
                new invite.
              </>
            }
            confirmLabel="Leave"
            variant="destructive"
            onConfirm={async () => {
              if (!myCharacter) return;
              const result = await callAction(
                leaveCampaign({
                  characterId: myCharacter.id,
                  campaignId: campaign.id,
                }),
                { onSuccess: "Left fellowship" },
              );
              if (result) {
                router.push("/dashboard");
              }
            }}
          />
        )}
      </Card.Body>
    </Card>
  );
}
