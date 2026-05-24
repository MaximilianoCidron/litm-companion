import type { Metadata, Viewport } from "next";
import { Cinzel, Inter, Spectral } from "next/font/google";
import { ThemeScript } from "@/shared/components/ThemeScript";
import { Providers } from "@/shared/components/Providers";
import {
  getThemeCookie,
  htmlClassForTheme,
} from "@/shared/auth/theme-cookie";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Codex",
  description: "Companion app for table-side play.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // SSR theme class — read the cookie set by updateUserSettings (or the
  // session POST). "system" and missing both result in no class; ThemeScript
  // + ThemeApplier resolve via OS preference + Firestore listener.
  const themePreference = await getThemeCookie();
  const themeClass = htmlClassForTheme(themePreference);

  const baseClass = `${inter.variable} ${spectral.variable} ${cinzel.variable} h-full antialiased`;
  const htmlClass = themeClass ? `${themeClass} ${baseClass}` : baseClass;

  return (
    <html lang="en" className={htmlClass} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
