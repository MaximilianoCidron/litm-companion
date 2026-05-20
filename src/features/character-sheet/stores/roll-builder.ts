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

  toggleTag(key: TagInvocationKey, payload: Omit<InvokedTagEntry, "burn">): void;
  toggleBurn(key: TagInvocationKey): void;
  toggleStatus(id: StatusId): void;
  setMight(m: MightModifier): void;
  setReaction(b: boolean): void;
  setExpanded(b: boolean): void;
  openResultDialog(rollId: string): void;
  closeResultDialog(): void;
  reset(): void;
  resetSelectionOnly(): void;
}

export function makeTagKey(
  location: TagLocation,
  tagId: TagId,
): TagInvocationKey {
  if (location.kind === "theme") return `theme:${location.themeId}:${tagId}`;
  return `backpack:${tagId}`;
}

export const useRollBuilder = create<RollBuilderState>()(
  immer((set) => ({
    invokedTags: new Map<TagInvocationKey, InvokedTagEntry>(),
    invokedStatuses: new Set<StatusId>(),
    mightModifier: 0 as MightModifier,
    isReaction: false,
    expanded: false,
    resultDialogRollId: null,

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
    openResultDialog: (rollId) =>
      set((s) => {
        s.resultDialogRollId = rollId;
      }),
    closeResultDialog: () =>
      set((s) => {
        s.resultDialogRollId = null;
      }),
    reset: () =>
      set((s) => {
        s.invokedTags.clear();
        s.invokedStatuses.clear();
        s.mightModifier = 0 as MightModifier;
        s.isReaction = false;
        s.expanded = false;
        s.resultDialogRollId = null;
      }),
    resetSelectionOnly: () =>
      set((s) => {
        s.invokedTags.clear();
        s.invokedStatuses.clear();
        s.mightModifier = 0 as MightModifier;
        s.isReaction = false;
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
