import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-medium " +
    "transition-colors " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-parchment " +
    "dark:focus-visible:ring-offset-ink " +
    "disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary:
          "bg-ember text-parchment-elevated hover:bg-ember-hover active:bg-ember-active",
        secondary:
          "bg-parchment-soft text-ink-base border border-mist-light " +
          "hover:bg-parchment-elevated " +
          "dark:bg-ink-soft dark:text-parchment-base dark:border-mist-dark " +
          "dark:hover:bg-ink-elevated",
        ghost:
          "text-ink-base hover:bg-parchment-soft " +
          "dark:text-parchment-base dark:hover:bg-ink-soft",
        destructive:
          "bg-crimson text-parchment-elevated hover:bg-crimson/90 " +
          "dark:bg-crimson-dark dark:hover:bg-crimson-dark/90",
      },
      size: {
        sm: "h-10 px-3 text-sm",
        md: "h-11 px-4 text-base",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11 p-0",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { className, variant, size, fullWidth, asChild = false, ...props },
    ref,
  ) {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        {...props}
      />
    );
  },
);

export { buttonVariants };
