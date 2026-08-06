import { type ReactNode } from "react";

import { cn } from "@shared/lib/cn";

// We strictly omit interactive props to enforce the "non-interactive" design rule (Micro Spec M6 §2.2)
export interface BadgeProps extends Omit<
  React.HTMLAttributes<HTMLSpanElement>,
  "onClick" | "onKeyDown" | "onKeyUp" | "tabIndex"
> {
  children?: ReactNode;
  variant?:
    | "neutral"
    | "accent"
    | "secondary"
    | "success"
    | "warning"
    | "danger"
    | "outline";
  size?: "sm" | "md";
  icon?: ReactNode;
  dot?: boolean;
}

export const Badge = ({
  children,
  variant = "neutral",
  size = "md",
  icon,
  dot,
  className,
  ...props
}: BadgeProps) => {
  // Defensive check: forcibly reject onClick or tabIndex at runtime
  // to ensure it never becomes interactive even if TypeScript is bypassed
  const safeProps = { ...props } as React.HTMLAttributes<HTMLSpanElement>;
  delete safeProps.onClick;
  delete safeProps.onKeyDown;
  delete safeProps.onKeyUp;
  delete safeProps.tabIndex;

  const isSm = size === "sm";

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors",
        // Sizes
        isSm
          ? "h-5 gap-1 px-2 text-body-xs"
          : "h-6 gap-1.5 px-2.5 text-body-sm",
        "rounded-full",
        // Variants
        variant === "neutral" &&
          "border border-subtle bg-surface-raised text-secondary",
        variant === "accent" && "bg-accent-primary text-on-accent",
        variant === "secondary" && "bg-accent-secondary text-on-accent",
        variant === "success" && "bg-success text-on-accent",
        variant === "warning" && "bg-warning text-on-accent",
        variant === "danger" && "bg-danger text-on-accent",
        variant === "outline" &&
          "border border-strong bg-transparent text-primary",
        className,
      )}
      {...safeProps}
    >
      {dot && (
        <span
          className={cn(
            "shrink-0 rounded-full",
            isSm ? "h-1 w-1" : "h-1.5 w-1.5",
            variant === "outline" || variant === "neutral"
              ? "bg-current"
              : "bg-on-accent",
          )}
          aria-hidden="true"
        />
      )}
      {icon && (
        <span
          className="flex shrink-0 items-center justify-center"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};
