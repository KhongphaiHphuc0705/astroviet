import { forwardRef, type ElementType, type HTMLAttributes } from "react";

import { cn } from "@shared/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "raised" | "outline-accent";
  padding?: "none" | "sm" | "md" | "lg";
  interactive?: boolean;
  as?: ElementType;
  htmlFor?: string; // allow htmlFor when used as label
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      padding = "md",
      interactive = false,
      as: Component = "div",
      ...props
    },
    ref,
  ) => {
    return (
      <Component
        ref={ref}
        className={cn(
          "overflow-hidden rounded-md text-primary",
          // Padding
          padding === "none" && "p-0",
          padding === "sm" && "p-4",
          padding === "md" && "p-6",
          padding === "lg" && "p-8",
          // Variants
          variant === "default" &&
            "border border-subtle bg-surface shadow-level-1",
          variant === "raised" &&
            "border border-strong bg-surface-raised shadow-level-2",
          variant === "outline-accent" &&
            "border border-accent-secondary bg-surface shadow-level-1",
          // Interactive
          interactive &&
            "cursor-pointer transition-colors focus-within:border-accent-primary focus-within:ring-2 focus-within:ring-focus hover:border-accent-primary hover:bg-surface-raised",
          className,
        )}
        {...props}
      />
    );
  },
);

Card.displayName = "Card";
