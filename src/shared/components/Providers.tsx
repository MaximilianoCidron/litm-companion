"use client";
import { useEffect, type ReactNode } from "react";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { Toaster } from "@/shared/ui/toaster";
import { BodyScrollbar } from "@/shared/components/BodyScrollbar";
import { useHydrateTheme } from "@/shared/stores/ui-store";

export function Providers({ children }: { children: ReactNode }) {
  const hydrateTheme = useHydrateTheme();
  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  return (
    <TooltipProvider delayDuration={300}>
      <BodyScrollbar />
      {children}
      <Toaster />
    </TooltipProvider>
  );
}
