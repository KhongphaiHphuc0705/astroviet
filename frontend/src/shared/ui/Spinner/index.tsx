import { type HTMLAttributes } from "react";

import { cn } from "@shared/lib/cn";

export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: "xs" | "sm" | "md" | "lg";
  label?: string;
}

export const Spinner = ({
  size = "md",
  label = "Đang tải...",
  className,
  ...props
}: SpinnerProps) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "inline-flex items-center justify-center text-current",
        size === "xs" && "h-4 w-4",
        size === "sm" && "h-5 w-5",
        size === "md" && "h-6 w-6",
        size === "lg" && "h-8 w-8",
        className,
      )}
      {...props}
    >
      <svg
        className="h-full w-full animate-spin motion-reduce:animate-[spin_3s_linear_infinite]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 100 100"
      >
        <defs>
          <mask id="ring-mask">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="white"
              strokeWidth="20"
              strokeDasharray="83.77 167.55"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />
          </mask>
        </defs>
        <g mask="url(#ring-mask)">
          {/* Solid base arc */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          {/* Ticks every 5 degrees (circumference = 251.327, 72 ticks) */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray="1.5 1.9906"
          />
        </g>
      </svg>
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
};
