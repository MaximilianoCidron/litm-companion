"use client";
import * as React from "react";
import {
  OverlayScrollbarsComponent,
  type OverlayScrollbarsComponentRef,
} from "overlayscrollbars-react";
import type { PartialOptions } from "overlayscrollbars";
import { cn } from "@/shared/lib/cn";

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  options?: PartialOptions;
}

const baseOptions: PartialOptions = {
  scrollbars: {
    theme: "os-theme-codex",
    autoHide: "leave",
    autoHideDelay: 800,
    dragScroll: true,
    clickScroll: true,
  },
  overflow: { x: "scroll", y: "scroll" },
};

export const ScrollArea = React.forwardRef<
  OverlayScrollbarsComponentRef,
  ScrollAreaProps
>(function ScrollArea({ className, options, children, ...props }, ref) {
  const merged: PartialOptions = {
    ...baseOptions,
    ...options,
    scrollbars: { ...baseOptions.scrollbars, ...options?.scrollbars },
    overflow: { ...baseOptions.overflow, ...options?.overflow },
  };

  return (
    <OverlayScrollbarsComponent
      ref={ref}
      element="div"
      options={merged}
      defer
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {children}
    </OverlayScrollbarsComponent>
  );
});
