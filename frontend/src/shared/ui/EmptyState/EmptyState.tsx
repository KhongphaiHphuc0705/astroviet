import { type ReactNode } from "react";

import { cn } from "@shared/lib/cn";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: "default" | "danger";
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  const isDanger = variant === "danger";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className,
      )}
      role={isDanger ? "alert" : "status"}
    >
      {icon && (
        <div
          data-testid="empty-state-icon"
          className={cn(
            "mb-4 flex h-16 w-16 items-center justify-center rounded-full",
            isDanger
              ? "bg-danger-50 text-danger"
              : "bg-surface-hover text-subtle",
          )}
        >
          {icon}
        </div>
      )}
      <h3
        className={cn(
          "mb-2 text-heading-sm font-semibold",
          isDanger ? "text-danger" : "text-default",
        )}
      >
        {title}
      </h3>
      {description && (
        <p className="text-body-base mb-6 max-w-md text-subtle">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
