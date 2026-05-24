import "server-only";
import { cookies } from "next/headers";

export const THEME_COOKIE_NAME = "theme-preference";

// Mirror of `ThemePreference` from features/character-sheet/schemas. Repeated
// here to respect the shared→features boundary; the values must stay in sync
// with the Zod enum.
export type ThemePreference = "light" | "dark" | "system";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 365, // 1 year
};

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system";
}

export async function setThemeCookie(value: ThemePreference): Promise<void> {
  const store = await cookies();
  store.set(THEME_COOKIE_NAME, value, COOKIE_OPTIONS);
}

export async function getThemeCookie(): Promise<ThemePreference | null> {
  const store = await cookies();
  const raw = store.get(THEME_COOKIE_NAME)?.value;
  return isThemePreference(raw) ? raw : null;
}

export async function clearThemeCookie(): Promise<void> {
  const store = await cookies();
  store.delete(THEME_COOKIE_NAME);
}

/**
 * Map a theme preference to the class to apply on the <html> element during
 * SSR. "system" returns null so the client-side media query decides.
 */
export function htmlClassForTheme(
  preference: ThemePreference | null,
): "dark" | null {
  return preference === "dark" ? "dark" : null;
}
