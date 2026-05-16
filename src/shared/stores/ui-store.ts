"use client";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

/**
 * Transient UI state ONLY. Never store Firestore data here.
 * Anything mechanical (themes, tags, statuses) lives in onSnapshot listeners.
 */
interface UIState {
  mobileDrawerOpen: boolean;
  activeModal: string | null;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleMobileDrawer: () => void;
  setActiveModal: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(
  immer((set) => ({
    mobileDrawerOpen: false,
    activeModal: null,
    openMobileDrawer: () =>
      set((s) => {
        s.mobileDrawerOpen = true;
      }),
    closeMobileDrawer: () =>
      set((s) => {
        s.mobileDrawerOpen = false;
      }),
    toggleMobileDrawer: () =>
      set((s) => {
        s.mobileDrawerOpen = !s.mobileDrawerOpen;
      }),
    setActiveModal: (id) =>
      set((s) => {
        s.activeModal = id;
      }),
  })),
);

// Selector hooks (prevents re-renders on unrelated slice changes).
export const useMobileDrawerOpen = (): boolean =>
  useUIStore((s) => s.mobileDrawerOpen);
export const useActiveModal = (): string | null =>
  useUIStore((s) => s.activeModal);
