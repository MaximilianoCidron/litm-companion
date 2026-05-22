// TODO(refactor): promote campaign subdomain to its own feature.
"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useCampaignSnapshot, type CampaignSnapshotState } from "../hooks/use-campaign-snapshot";
import { useCharacter } from "./CharacterProvider";
import type { Campaign } from "../schemas";

export type CampaignContextValue =
  | { status: "none" }
  | { status: "live"; campaign: Campaign; role: "gm" | "member"; error: null }
  | {
      status: "error";
      campaign: Campaign | null;
      role: "gm" | "member" | null;
      error: Error;
    };

const CampaignContext = createContext<CampaignContextValue | null>(null);

interface CampaignProviderProps {
  initial: Campaign | null;
  /**
   * Current user uid — passed from the server layout. Used to derive role
   * ("gm" vs "member"). Optional: when undefined the provider falls back
   * to membership inference via the character's userId.
   */
  currentUid?: string;
  /**
   * Explicit campaign id override. When provided, the provider subscribes
   * to this id instead of `character.campaignIds[0]`. Used by the campaign
   * route layout where there's no character context.
   */
  campaignId?: string | null;
  children: ReactNode;
}

function resolveRole(
  campaign: Campaign,
  uid: string | undefined,
): "gm" | "member" {
  if (uid && campaign.gmUid === uid) return "gm";
  return "member";
}

/**
 * Subscribes to a campaign doc and exposes role. When mounted inside the
 * character layout, defaults to `character.campaignIds[0]`. When mounted in
 * the campaign route layout, pass `campaignId` explicitly.
 */
export function CampaignProvider({
  initial,
  currentUid,
  campaignId,
  children,
}: CampaignProviderProps) {
  return campaignId !== undefined ? (
    <FixedCampaignProvider
      initial={initial}
      currentUid={currentUid}
      campaignId={campaignId}
    >
      {children}
    </FixedCampaignProvider>
  ) : (
    <CharacterScopedCampaignProvider
      initial={initial}
      currentUid={currentUid}
    >
      {children}
    </CharacterScopedCampaignProvider>
  );
}

function CharacterScopedCampaignProvider({
  initial,
  currentUid,
  children,
}: {
  initial: Campaign | null;
  currentUid?: string;
  children: ReactNode;
}) {
  const { character } = useCharacter();
  const characterUid = character.userId;
  const effectiveUid = currentUid ?? characterUid;
  const campaignId = character.campaignIds[0] ?? null;
  const state = useCampaignSnapshot(campaignId, initial);
  const value = useMemo(
    () => toContextValue(state, effectiveUid),
    [state, effectiveUid],
  );
  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

function FixedCampaignProvider({
  initial,
  currentUid,
  campaignId,
  children,
}: {
  initial: Campaign | null;
  currentUid?: string;
  campaignId: string | null;
  children: ReactNode;
}) {
  const state = useCampaignSnapshot(campaignId, initial);
  const value = useMemo(
    () => toContextValue(state, currentUid),
    [state, currentUid],
  );
  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

function toContextValue(
  state: CampaignSnapshotState,
  uid: string | undefined,
): CampaignContextValue {
  if (state.status === "none") return { status: "none" };
  if (state.status === "live") {
    return {
      status: "live",
      campaign: state.campaign,
      role: resolveRole(state.campaign, uid),
      error: null,
    };
  }
  return {
    status: "error",
    campaign: state.campaign,
    role: state.campaign ? resolveRole(state.campaign, uid) : null,
    error: state.error,
  };
}

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) {
    throw new Error("useCampaign must be used inside <CampaignProvider>.");
  }
  return ctx;
}
