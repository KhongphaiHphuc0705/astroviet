import { type HTMLAttributes } from "react";

import { cn } from "@shared/lib/cn";

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-surface-hover motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
};
