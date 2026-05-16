import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const inputVariants = cva(
  "flex h-11 w-full rounded-lg border bg-parchment-elevated px-3 text-base " +
    "text-ink-base placeholder:text-ink-subtle " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember " +
    "disabled:opacity-50 disabled:pointer-events-none " +
    "dark:bg-ink-elevated dark:text-parchment-base dark:placeholder:text-parchment-subtle",
  {
    variants: {
      state: {
        default: "border-mist-light dark:border-mist-dark",
        error: "border-crimson dark:border-crimson-dark",
      },
    },
    defaultVariants: {
      state: "default",
    },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, state, type = "text", ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(inputVariants({ state, className }))}
        {...props}
      />
    );
  },
);
