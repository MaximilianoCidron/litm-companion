"use client";
import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(function ToastViewport({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Viewport
      ref={ref}
      className={cn(
        "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse gap-2 p-4 sm:max-w-sm",
        className,
      )}
      {...props}
    />
  );
});

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-lg border p-4 shadow-md " +
    "data-[state=open]:animate-in data-[state=closed]:animate-out " +
    "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]",
  {
    variants: {
      variant: {
        default:
          "border-mist-light bg-parchment-elevated text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base",
        success:
          "border-l-4 border-l-moss border-mist-light bg-parchment-elevated text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base",
        warning:
          "border-l-4 border-l-rust border-mist-light bg-parchment-elevated text-ink-base dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base",
        destructive:
          "border-l-4 border-l-crimson border-mist-light bg-parchment-elevated text-ink-base dark:border-l-crimson-dark dark:border-mist-dark dark:bg-ink-elevated dark:text-parchment-base",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface ToastRootProps
  extends React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {}

export const Toast = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Root>,
  ToastRootProps
>(function Toast({ className, variant, ...props }, ref) {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(toastVariants({ variant, className }))}
      {...props}
    />
  );
});

export const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Title>
>(function ToastTitle({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Title
      ref={ref}
      className={cn("font-display text-sm font-semibold tracking-tight", className)}
      {...props}
    />
  );
});

export const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Description>
>(function ToastDescription({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Description
      ref={ref}
      className={cn(
        "text-sm text-ink-muted dark:text-parchment-muted",
        className,
      )}
      {...props}
    />
  );
});

export const ToastClose = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Close>
>(function ToastClose({ className, ...props }, ref) {
  return (
    <ToastPrimitive.Close
      ref={ref}
      aria-label="Dismiss"
      className={cn(
        "absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded text-ink-muted hover:text-ink-base " +
          "dark:text-parchment-muted dark:hover:text-parchment-base " +
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember",
        className,
      )}
      {...props}
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </ToastPrimitive.Close>
  );
});

export type ToastVariant = NonNullable<VariantProps<typeof toastVariants>["variant"]>;
