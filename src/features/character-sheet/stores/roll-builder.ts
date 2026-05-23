"use client";
import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { MightModifier, TagLocation } from "../schemas";
import type { StatusId, TagId } from "../schemas/ids";

enableMapSet();

export type TagInvocationKey = string;

export interface InvokedTagEntry {
  tagId: TagId;
  location: TagLocation;
  burn: boolean;
}

export interface RollBuilderState {
  invokedTags: Map<TagInvocationKey, InvokedTagEntry>;
  invokedStatuses: Set<StatusId>;
  mightModifier: MightModifier;
  isReaction: boolean;
  expanded: boolean;
  resultDialogRollId: string | null;
  resultDialogAnimate: boolean;
  reactingToPendingThreatId: string | null;
  reactingToCampaignId: string | null;

  toggleTag(key: TagInvocationKey, payload: Omit<InvokedTagEntry, "burn">): void;
  toggleBurn(key: TagInvocationKey): void;
  toggleStatus(id: StatusId): void;
  setMight(m: MightModifier): void;
  setReaction(b: boolean): void;
  setExpanded(b: boolean): void;
  openResultDialog(rollId: string, animate?: boolean): void;
  closeResultDialog(): void;
  beginReaction(pendingThreatId: string, campaignId: string): void;
  clearReaction(): void;
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

export const useRollBuilder = create<RollBuilderState>()(
  immer((set) => ({
    invokedTags: new Map<TagInvocationKey, InvokedTagEntry>(),
    invokedStatuses: new Set<StatusId>(),
    mightModifier: 0 as MightModifier,
    isReaction: false,
    expanded: false,
    resultDialogRollId: null,
    resultDialogAnimate: true,
    reactingToPendingThreatId: null,
    reactingToCampaignId: null,

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
    toggleStatus: (id) =>
      set((s) => {
        if (s.invokedStatuses.has(id)) s.invokedStatuses.delete(id);
        else s.invokedStatuses.add(id);
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
      }),
    clearReaction: () =>
      set((s) => {
        s.reactingToPendingThreatId = null;
        s.reactingToCampaignId = null;
        s.isReaction = false;
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
      }),
    resetSelectionOnly: () =>
      set((s) => {
        s.invokedTags.clear();
        s.invokedStatuses.clear();
        s.mightModifier = 0 as MightModifier;
        s.isReaction = false;
        s.reactingToPendingThreatId = null;
        s.reactingToCampaignId = null;
      }),
  })),
);

export const useInvokedTags = (): Map<TagInvocationKey, InvokedTagEntry> =>
  useRollBuilder((s) => s.invokedTags);
export const useInvokedStatuses = (): Set<StatusId> =>
  useRollBuilder((s) => s.invokedStatuses);
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
