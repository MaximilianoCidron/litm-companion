"use client";
import { useEffect } from "react";
import { setStoredTheme } from "@/shared/lib/theme";
import { useUserSettings } from "./UserSettingsProvider";

/**
 * Mirrors the Firestore themePreference to the live <html> dark class +
 * localStorage (so the pre-paint ThemeScript can read it on the next load
 * and avoid FOUC). Subscribes to the OS color-scheme media query when
 * preference is "system".
 */
export function ThemeApplier() {
  const { themePreference } = useUserSettings();

  useEffect(() => {
    const root = document.documentElement;
    const apply = () => {
      let dark: boolean;
      if (themePreference === "system") {
        dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        dark = themePreference === "dark";
      }
      root.classList.toggle("dark", dark);
    };

    apply();
    setStoredTheme(themePreference);

    if (themePreference === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply();
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [themePreference]);

  return null;
}
