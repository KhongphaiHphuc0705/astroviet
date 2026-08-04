import {
  forwardRef,
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type ReactNode,
} from "react";

import { cn } from "@shared/lib/cn";

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
        disabled={disabled || isLoading}
        aria-busy={isLoading ? "true" : undefined}
        className={cn(
          "relative inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50",
          // Active state (Micro Spec §1.5)
          "active:scale-[0.98]",
          // Size
          !iconOnly && size === "sm" && "h-9 rounded-md px-3 text-body-sm",
          !iconOnly && size === "md" && "h-11 rounded-md px-4 text-body-md", // h-11 = 44px
          !iconOnly && size === "lg" && "h-14 rounded-lg px-6 text-body-lg",
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
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-current">
            {/* TODO(M6): Replace with standard icon */}
            <svg
              className="h-5 w-5 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </span>
        )}
      </Component>
    );
  },
);

Button.displayName = "Button";
