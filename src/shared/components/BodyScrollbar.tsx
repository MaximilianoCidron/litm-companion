"use client";
import { useEffect } from "react";
import { useOverlayScrollbars } from "overlayscrollbars-react";

/**
 * Mounts OverlayScrollbars on document.body so the entire page uses the
 * Codex-themed overlay scrollbar instead of the native one.
 * Must be rendered exactly once inside <Providers>.
 */
export function BodyScrollbar() {
  const [initialize, instance] = useOverlayScrollbars({
    options: {
      scrollbars: {
        theme: "os-theme-codex",
        autoHide: "leave",
        autoHideDelay: 800,
        dragScroll: true,
        clickScroll: true,
      },
    },
    defer: true,
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    initialize({
      target: document.body,
      cancel: { body: false },
    });
    return () => {
      instance()?.destroy();
    };
  }, [initialize, instance]);

  return null;
}
