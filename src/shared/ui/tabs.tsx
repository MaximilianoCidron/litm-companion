"use client";
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/shared/lib/cn";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg bg-parchment-soft p-1 dark:bg-ink-soft",
        "data-[orientation=vertical]:flex-col data-[orientation=vertical]:items-stretch",
        className,
      )}
      {...props}
    />
  );
});

export const TabsTrigger = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md px-3 text-sm font-medium " +
          "text-ink-muted transition-colors hover:text-ink-base " +
          "dark:text-parchment-muted dark:hover:text-parchment-base " +
          "data-[state=active]:bg-ember/15 data-[state=active]:text-ember-text-light " +
          "dark:data-[state=active]:text-ember-text-dark " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember " +
          "focus-visible:ring-offset-2 focus-visible:ring-offset-parchment dark:focus-visible:ring-offset-ink " +
          "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={cn(
        "mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
        className,
      )}
      {...props}
    />
  );
});
