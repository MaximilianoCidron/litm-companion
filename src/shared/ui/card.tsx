import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/shared/lib/cn";

const cardVariants = cva(
  "rounded-lg border text-ink-base dark:text-parchment-base overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "bg-parchment-elevated border-mist-light dark:bg-ink-elevated dark:border-mist-dark",
        inset:
          "bg-parchment-soft border-mist-light dark:bg-ink-soft dark:border-mist-dark",
        interactive:
          "bg-parchment-elevated border-mist-light dark:bg-ink-elevated dark:border-mist-dark " +
          "transition-colors cursor-pointer hover:border-ember/60",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

export const CardRoot = React.forwardRef<HTMLDivElement, CardProps>(
  function CardRoot({ className, variant, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(cardVariants({ variant, className }))}
        {...props}
      />
    );
  },
);

interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  function CardHeader({ className, title, children, ...props }, ref) {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-between gap-2 bg-ink-muted px-4 py-2 text-parchment-elevated",
          className,
        )}
        {...props}
      >
        {title ? (
          <h3 className="font-display text-base tracking-tight">{title}</h3>
        ) : null}
        {children}
      </div>
    );
  },
);

export const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardBody({ className, ...props }, ref) {
  return <div ref={ref} className={cn("p-4 md:p-6", className)} {...props} />;
});

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(function CardFooter({ className, ...props }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-between gap-2 border-t border-mist-light px-4 py-3 dark:border-mist-dark",
        className,
      )}
      {...props}
    />
  );
});

interface CardCompound
  extends React.ForwardRefExoticComponent<
    CardProps & React.RefAttributes<HTMLDivElement>
  > {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
}

const Card = CardRoot as CardCompound;
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export { Card };
