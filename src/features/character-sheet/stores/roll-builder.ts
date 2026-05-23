"use client";
import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { MightModifier, StatusLocation, TagLocation } from "../schemas";
import type { StatusId, TagId } from "../schemas/ids";

enableMapSet();

export type TagInvocationKey = string;
export type StatusInvocationKey = string;

export interface InvokedTagEntry {
  tagId: TagId;
  location: TagLocation;
  burn: boolean;
}

export interface InvokedStatusEntry {
  statusId: StatusId;
  location: StatusLocation;
}

export interface RollBuilderState {
  invokedTags: Map<TagInvocationKey, InvokedTagEntry>;
  invokedStatuses: Map<StatusInvocationKey, InvokedStatusEntry>;
  mightModifier: MightModifier;
  isReaction: boolean;
  expanded: boolean;
  resultDialogRollId: string | null;
  resultDialogAnimate: boolean;
  reactingToPendingThreatId: string | null;
  reactingToCampaignId: string | null;
  isDetailedAction: boolean;
  detailedActionChallengeId: string | null;
  detailedActionCampaignId: string | null;

  toggleTag(key: TagInvocationKey, payload: Omit<InvokedTagEntry, "burn">): void;
  toggleBurn(key: TagInvocationKey): void;
  toggleStatus(key: StatusInvocationKey, payload: InvokedStatusEntry): void;
  setMight(m: MightModifier): void;
  setReaction(b: boolean): void;
  setExpanded(b: boolean): void;
  openResultDialog(rollId: string, animate?: boolean): void;
  closeResultDialog(): void;
  beginReaction(pendingThreatId: string, campaignId: string): void;
  clearReaction(): void;
  setDetailedAction(
    challengeId: string | null,
    campaignId: string | null,
  ): void;
  clearDetailedAction(): void;
  reset(): void;
  resetSelectionOnly(): void;
}

export function makeTagKey(
  location: TagLocation,
  tagId: TagId,
): TagInvocationKey {
  if (location.kind === "theme") return `theme:${location.themeId}:${tagId}`;
  if (location.kind === "backpack") return `backpack:${tagId}`;
  if (location.kind === "fellowship")
    return `fellowship:${location.campaignId}:${tagId}`;
  if (location.kind === "challenge")
    return `challenge:${location.challengeId}:${tagId}`;
  return `relationship:${location.relationshipId}`;
}

export function makeStatusKey(
  location: StatusLocation,
  statusId: StatusId,
): StatusInvocationKey {
  if (location.kind === "character") return `character:${statusId}`;
  return `challenge:${location.challengeId}:${statusId}`;
}

export const useRollBuilder = create<RollBuilderState>()(
  immer((set) => ({
    invokedTags: new Map<TagInvocationKey, InvokedTagEntry>(),
    invokedStatuses: new Map<StatusInvocationKey, InvokedStatusEntry>(),
    mightModifier: 0 as MightModifier,
    isReaction: false,
    expanded: false,
    resultDialogRollId: null,
    resultDialogAnimate: true,
    reactingToPendingThreatId: null,
    reactingToCampaignId: null,
    isDetailedAction: false,
    detailedActionChallengeId: null,
    detailedActionCampaignId: null,

    toggleTag: (key, payload) =>
      set((s) => {
        if (s.invokedTags.has(key)) {
          s.invokedTags.delete(key);
        } else {
          s.invokedTags.set(key, { ...payload, burn: false });
        }
      }),
    toggleBurn: (key) =>
      set((s) => {
        const entry = s.invokedTags.get(key);
        if (entry) entry.burn = !entry.burn;
      }),
    toggleStatus: (key, payload) =>
      set((s) => {
        if (s.invokedStatuses.has(key)) {
          s.invokedStatuses.delete(key);
        } else {
          s.invokedStatuses.set(key, payload);
        }
      }),
    setMight: (m) =>
      set((s) => {
        s.mightModifier = m;
      }),
    setReaction: (b) =>
      set((s) => {
        s.isReaction = b;
      }),
    setExpanded: (b) =>
      set((s) => {
        s.expanded = b;
      }),
    openResultDialog: (rollId, animate = true) =>
      set((s) => {
        s.resultDialogRollId = rollId;
        s.resultDialogAnimate = animate;
      }),
    closeResultDialog: () =>
      set((s) => {
        s.resultDialogRollId = null;
        s.resultDialogAnimate = true;
      }),
    beginReaction: (pendingThreatId, campaignId) =>
      set((s) => {
        s.invokedTags.clear();
        s.invokedStatuses.clear();
        s.mightModifier = 0 as MightModifier;
        s.isReaction = true;
        s.expanded = true;
        s.reactingToPendingThreatId = pendingThreatId;
        s.reactingToCampaignId = campaignId;
        // Mutually exclusive with Detailed action.
        s.isDetailedAction = false;
        s.detailedActionChallengeId = null;
        s.detailedActionCampaignId = null;
      }),
    clearReaction: () =>
      set((s) => {
        s.reactingToPendingThreatId = null;
        s.reactingToCampaignId = null;
        s.isReaction = false;
      }),
    setDetailedAction: (challengeId, campaignId) =>
      set((s) => {
        if (challengeId && campaignId) {
          s.isDetailedAction = true;
          s.detailedActionChallengeId = challengeId;
          s.detailedActionCampaignId = campaignId;
          // Mutually exclusive with Reaction.
          s.isReaction = false;
          s.reactingToPendingThreatId = null;
          s.reactingToCampaignId = null;
        } else {
          s.isDetailedAction = false;
          s.detailedActionChallengeId = null;
          s.detailedActionCampaignId = null;
        }
      }),
    clearDetailedAction: () =>
      set((s) => {
        s.isDetailedAction = false;
        s.detailedActionChallengeId = null;
        s.detailedActionCampaignId = null;
      }),
    reset: () =>
      set((s) => {
        s.invokedTags.clear();
        s.invokedStatuses.clear();
        s.mightModifier = 0 as MightModifier;
        s.isReaction = false;
        s.expanded = false;
        s.resultDialogRollId = null;
        s.resultDialogAnimate = true;
        s.reactingToPendingThreatId = null;
        s.reactingToCampaignId = null;
        s.isDetailedAction = false;
        s.detailedActionChallengeId = null;
        s.detailedActionCampaignId = null;
      }),
    resetSelectionOnly: () =>
      set((s) => {
        s.invokedTags.clear();
        s.invokedStatuses.clear();
        s.mightModifier = 0 as MightModifier;
        s.isReaction = false;
        s.reactingToPendingThreatId = null;
        s.reactingToCampaignId = null;
        s.isDetailedAction = false;
        s.detailedActionChallengeId = null;
        s.detailedActionCampaignId = null;
      }),
  })),
);

export const useInvokedTags = (): Map<TagInvocationKey, InvokedTagEntry> =>
  useRollBuilder((s) => s.invokedTags);
export const useInvokedStatuses = (): Map<
  StatusInvocationKey,
  InvokedStatusEntry
> => useRollBuilder((s) => s.invokedStatuses);
export const useMightModifier = (): MightModifier =>
  useRollBuilder((s) => s.mightModifier);
export const useIsReaction = (): boolean => useRollBuilder((s) => s.isReaction);
export const useRollBuilderExpanded = (): boolean =>
  useRollBuilder((s) => s.expanded);
export const useResultDialogRollId = (): string | null =>
  useRollBuilder((s) => s.resultDialogRollId);
export const useResultDialogAnimate = (): boolean =>
  useRollBuilder((s) => s.resultDialogAnimate);
export const useReactingToPendingThreatId = (): string | null =>
  useRollBuilder((s) => s.reactingToPendingThreatId);
export const useReactingToCampaignId = (): string | null =>
  useRollBuilder((s) => s.reactingToCampaignId);
export const useIsDetailedAction = (): boolean =>
  useRollBuilder((s) => s.isDetailedAction);
export const useDetailedActionChallengeId = (): string | null =>
  useRollBuilder((s) => s.detailedActionChallengeId);
export const useDetailedActionCampaignId = (): string | null =>
  useRollBuilder((s) => s.detailedActionCampaignId);
