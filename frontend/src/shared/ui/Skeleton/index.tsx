import { type HTMLAttributes } from "react";

import { cn } from "@shared/lib/cn";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
  count?: number;
}

export const Skeleton = ({
  variant = "rectangular",
  width,
  height,
  count = 1,
  className,
  ...props
}: SkeletonProps) => {
  const elements = [];

  for (let i = 0; i < count; i++) {
    elements.push(
      <div
        key={i}
        aria-hidden="true"
        style={{ width, height }}
        className={cn(
          "animate-pulse bg-subtle motion-reduce:animate-none",
          variant === "text" && "h-4 w-full rounded-md",
          variant === "circular" && "rounded-full",
          variant === "rectangular" && "rounded-md",
          className,
        )}
        {...props}
      />,
    );
  }

  if (count === 1) {
    return elements[0];
  }

  return <div className="flex flex-col gap-2">{elements}</div>;
};
