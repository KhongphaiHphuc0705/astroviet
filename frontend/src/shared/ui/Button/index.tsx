import {
  forwardRef,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@shared/lib/cn";
import { Spinner } from "@shared/ui/Spinner";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
    variant?: "primary" | "secondary" | "ghost" | "danger" | "link";
    size?: "sm" | "md" | "lg";
    iconOnly?: boolean;
    isLoading?: boolean;
    leftIcon?: ReactNode;
    rightIcon?: ReactNode;
  };

export const Button = forwardRef<HTMLElement, ButtonProps>(
  (
    {
      as,
      className,
      variant = "primary",
      size = "md",
      iconOnly = false,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const Component = as || (props.href ? "a" : "button");

    return (
      <Component
        ref={ref}
        disabled={disabled}
        aria-disabled={disabled || isLoading ? "true" : undefined}
        aria-busy={isLoading ? "true" : undefined}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          if (disabled || isLoading) {
            e.preventDefault();
            return;
          }
          props.onClick?.(e);
        }}
        className={cn(
          "relative inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50",
          // Active state (Micro Spec §1.5)
          "active:scale-[0.98]",
          // Size
          !iconOnly && size === "sm" && "h-9 rounded-md px-3 py-2 text-body-sm",
          !iconOnly &&
            size === "md" &&
            "h-11 rounded-md px-4 py-2 text-body-md",
          !iconOnly &&
            size === "lg" &&
            "h-14 rounded-lg px-6 py-2 text-body-lg",
          // IconOnly sizing
          iconOnly && size === "sm" && "h-9 w-9 rounded-md",
          iconOnly && size === "md" && "h-11 w-11 rounded-md",
          iconOnly && size === "lg" && "h-14 w-14 rounded-lg",
          // Variant
          variant === "primary" &&
            "bg-accent-primary text-on-accent hover:opacity-90 active:opacity-80",
          variant === "secondary" &&
            "border border-strong bg-surface text-primary hover:bg-surface-raised",
          variant === "ghost" &&
            "bg-transparent text-primary hover:bg-surface-raised",
          variant === "danger" &&
            "bg-danger text-on-accent hover:opacity-90 active:opacity-80",
          variant === "link" &&
            "bg-transparent text-accent-primary underline-offset-4 hover:underline",
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-flex items-center gap-2",
            isLoading ? "opacity-0" : "opacity-100",
          )}
        >
          {leftIcon}
          {children}
          {rightIcon}
        </span>
        {isLoading && (
          <span className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center text-current">
            <Spinner size="sm" label="" />
          </span>
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";
