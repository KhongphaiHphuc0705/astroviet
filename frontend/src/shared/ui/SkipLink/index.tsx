import React from "react";

import { cn } from "@shared/lib/cn";

export interface SkipLinkProps {
  href?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SkipLink({
  href = "#main-content",
  className,
  children = "Chuyển đến nội dung chính",
}: SkipLinkProps) {
  return (
    <a
      href={href}
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-toast",
        "rounded-md bg-surface-raised px-4 py-2 text-primary shadow-level-2 outline-none focus:ring-2 focus:ring-focus",
        className,
      )}
    >
      {children}
    </a>
  );
}
