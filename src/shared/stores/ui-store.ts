"use client";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  applyTheme,
  getStoredTheme,
  resolveTheme,
  setStoredTheme,
  type ResolvedTheme,
  type Theme,
} from "@/shared/lib/theme";

/**
 * Transient UI state ONLY. Never store Firestore data here.
 * Anything mechanical (themes, tags, statuses) lives in onSnapshot listeners.
 */
interface UIState {
  mobileDrawerOpen: boolean;
  activeModal: string | null;
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  openMobileDrawer: () => void;
  closeMobileDrawer: () => void;
  toggleMobileDrawer: () => void;
  setActiveModal: (id: string | null) => void;
  setTheme: (theme: Theme) => void;
  hydrateTheme: () => void;
}

const initialTheme: Theme =
  typeof window === "undefined" ? "system" : getStoredTheme();
const initialResolved: ResolvedTheme =
  typeof window === "undefined" ? "light" : resolveTheme(initialTheme);

export const useUIStore = create<UIState>()(
  immer((set) => ({
    mobileDrawerOpen: false,
    activeModal: null,
    theme: initialTheme,
    resolvedTheme: initialResolved,
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
    setTheme: (theme) => {
      setStoredTheme(theme);
      const resolved = applyTheme(theme);
      set((s) => {
        s.theme = theme;
        s.resolvedTheme = resolved;
      });
    },
    hydrateTheme: () => {
      const stored = getStoredTheme();
      const resolved = applyTheme(stored);
      set((s) => {
        s.theme = stored;
        s.resolvedTheme = resolved;
      });
    },
  })),
);

export const useMobileDrawerOpen = (): boolean =>
  useUIStore((s) => s.mobileDrawerOpen);
export const useActiveModal = (): string | null =>
  useUIStore((s) => s.activeModal);
export const useTheme = (): Theme => useUIStore((s) => s.theme);
export const useResolvedTheme = (): ResolvedTheme =>
  useUIStore((s) => s.resolvedTheme);
export const useSetTheme = (): ((theme: Theme) => void) =>
  useUIStore((s) => s.setTheme);
export const useHydrateTheme = (): (() => void) =>
  useUIStore((s) => s.hydrateTheme);
