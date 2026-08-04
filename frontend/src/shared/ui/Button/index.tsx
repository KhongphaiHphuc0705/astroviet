import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { cn } from "@shared/lib/cn";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "relative inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-50",
          // Size
          size === "sm" && "h-9 rounded-md px-3 text-body-sm",
          size === "md" && "h-11 rounded-md px-4 text-body-md", // h-11 = 44px (hit-area)
          size === "lg" && "h-14 rounded-lg px-6 text-body-lg",
          size === "icon" && "h-11 w-11 rounded-md", // hit-area 44x44
          // Variant
          variant === "primary" &&
            "bg-accent-primary text-[var(--color-text-on-accent)] hover:opacity-90",
          variant === "secondary" &&
            "border border-strong bg-surface text-primary hover:bg-surface-raised",
          variant === "outline" &&
            "border border-strong bg-transparent text-primary hover:bg-surface",
          variant === "ghost" &&
            "bg-transparent text-primary hover:bg-surface-raised",
          variant === "danger" && "text-white bg-danger hover:opacity-90",
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
      </button>
    );
  },
);

Button.displayName = "Button";
