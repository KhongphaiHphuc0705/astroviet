import { forwardRef } from "react";

import { cn } from "@shared/lib/cn";

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  variant?: "solid" | "dashed" | "ring";
  label?: string;
}

export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      className,
      orientation = "horizontal",
      variant = "solid",
      label,
      ...props
    },
    ref,
  ) => {
    const isHorizontal = orientation === "horizontal";
    const isRing = variant === "ring";

    // If ring variant is used, it's purely decorative
    if (isRing) {
      return (
        <div
          ref={ref}
          role="separator"
          aria-hidden="true"
          className={cn(
            "pointer-events-none flex w-full items-center justify-center py-4 opacity-15",
            className,
          )}
          {...props}
        >
          {/* Decorative SVG for astrological ring feel */}
          <svg
            width="200"
            height="20"
            viewBox="0 0 200 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 10 Q 100 -10 200 10"
              stroke="currentColor"
              strokeWidth="1"
              fill="none"
            />
            {/* Tick marks */}
            <line
              x1="100"
              y1="0"
              x2="100"
              y2="10"
              stroke="currentColor"
              strokeWidth="1"
            />
            <line
              x1="50"
              y1="3"
              x2="50"
              y2="10"
              stroke="currentColor"
              strokeWidth="1"
            />
            <line
              x1="150"
              y1="3"
              x2="150"
              y2="10"
              stroke="currentColor"
              strokeWidth="1"
            />
          </svg>
        </div>
      );
    }

    const lineClasses = cn(
      "border-subtle",
      variant === "dashed" ? "border-dashed" : "border-solid",
      isHorizontal ? "border-t w-full" : "border-l h-full",
    );

    return (
      <div
        ref={ref}
        role="separator"
        aria-orientation={orientation}
        className={cn(
          "flex items-center",
          isHorizontal ? "w-full flex-row" : "h-full flex-col",
          className,
        )}
        {...props}
      >
        <div className={cn("flex-1", lineClasses)} />
        {label && (
          <span
            className={cn(
              "shrink-0 text-body-sm text-muted",
              isHorizontal ? "px-4" : "py-4",
            )}
          >
            {label}
          </span>
        )}
        {label && <div className={cn("flex-1", lineClasses)} />}
      </div>
    );
  },
);

Divider.displayName = "Divider";
