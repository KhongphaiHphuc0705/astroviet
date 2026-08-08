import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
} from "lucide-react";
import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@shared/lib/cn";

export interface AlertProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  variant?: "info" | "success" | "warning" | "danger";
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  onDismiss?: () => void;
}

const defaultIcons = {
  info: <Info className="h-5 w-5" aria-hidden="true" />,
  success: <CheckCircle2 className="h-5 w-5" aria-hidden="true" />,
  warning: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
  danger: <AlertCircle className="h-5 w-5" aria-hidden="true" />,
};

const variantStyles = {
  info: "bg-info/10 border-info/20 text-info",
  success: "bg-success/10 border-success/20 text-success",
  warning: "bg-warning/10 border-warning/20 text-warning",
  danger: "bg-danger/10 border-danger/20 text-danger",
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      className,
      variant = "info",
      title,
      description,
      icon,
      actions,
      onDismiss,
      ...props
    },
    ref,
  ) => {
    // Accessibility: role="alert" cho danger/warning, role="status" cho info/success
    const isAlert = variant === "danger" || variant === "warning";
    const role = isAlert ? "alert" : "status";

    return (
      <div
        ref={ref}
        role={role}
        className={cn(
          "relative flex w-full items-start gap-3 rounded-md border p-4",
          variantStyles[variant],
          className,
        )}
        {...props}
      >
        <div className="pt-0.5 shrink-0">{icon || defaultIcons[variant]}</div>

        <div className="flex flex-1 flex-col gap-1">
          {title && (
            <h5 className="text-body-md font-semibold leading-none tracking-tight">
              {title}
            </h5>
          )}
          {description && (
            <div className="text-body-sm opacity-90">{description}</div>
          )}
          {actions && (
            <div className="mt-2 flex items-center gap-2">{actions}</div>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="absolute right-2 top-2 rounded-sm p-1 opacity-70 ring-offset-canvas transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  },
);

Alert.displayName = "Alert";
