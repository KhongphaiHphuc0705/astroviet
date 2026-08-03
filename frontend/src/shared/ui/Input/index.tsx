import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from "react";

import { cn } from "@shared/lib/cn";
import { Label } from "@shared/ui/Label";

export interface InputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label?: string;
  error?: string | boolean;
  success?: boolean;
  helperText?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      success,
      helperText,
      id,
      disabled,
      readOnly,
      required,
      ...props
    },
    ref,
  ) => {
    const internalId = useId();
    const inputId = id || internalId;
    const descriptionId = `${inputId}-description`;

    const hasError = !!error;
    const errorMessage = typeof error === "string" ? error : undefined;
    const showDescription = !!errorMessage || !!helperText;

    return (
      <div className="gap-1.5 flex w-full flex-col">
        {label && (
          <Label
            htmlFor={inputId}
            required={required}
            className={cn(disabled && "cursor-not-allowed opacity-50")}
          >
            {label}
          </Label>
        )}
        <input
          id={inputId}
          ref={ref}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={hasError}
          aria-describedby={showDescription ? descriptionId : undefined}
          className={cn(
            "flex h-hit-area w-full items-center rounded-md border bg-surface px-4 py-2 text-body-md text-primary transition-colors",
            "placeholder:text-muted",
            "focus:outline-none focus:ring-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "read-only:bg-canvas",
            hasError
              ? "focus:ring-danger/20 border-danger focus:border-danger"
              : success
                ? "focus:ring-success/20 border-success focus:border-success"
                : "border-strong focus:border-accent-secondary focus:ring-focus",
            className,
          )}
          {...props}
        />
        {showDescription && (
          <div
            id={descriptionId}
            className={cn(
              "text-body-sm",
              hasError ? "text-danger" : "text-muted",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {errorMessage || helperText}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";
