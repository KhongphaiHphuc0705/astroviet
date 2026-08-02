import React from "react";

import { cn } from "@shared/lib/cn";

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className={cn(
        "sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[9999]",
        "rounded-md bg-surface-raised px-4 py-2 text-primary shadow-level-2 outline-none focus:ring-2 focus:ring-focus",
      )}
    >
      Skip to content
    </a>
  );
}
