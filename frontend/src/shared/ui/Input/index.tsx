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
  variant?: "default" | "filled";
  size?: "sm" | "md" | "lg";
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      success,
      helperText,
      variant = "default",
      size = "md",
      leftAdornment,
      rightAdornment,
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
        <div
          className={cn(
            "relative flex w-full items-center rounded-md border transition-colors focus-within:ring-2",
            // Variants
            !hasError &&
              !success &&
              variant === "default" &&
              "border-strong bg-surface focus-within:border-accent-secondary focus-within:ring-focus",
            !hasError &&
              !success &&
              variant === "filled" &&
              "border-transparent bg-canvas focus-within:border-accent-secondary focus-within:bg-surface focus-within:ring-focus",
            // Error
            hasError &&
              "focus-within:ring-danger/20 border-danger focus-within:border-danger",
            // Success
            success &&
              !hasError &&
              "focus-within:ring-success/20 border-success focus-within:border-success",
            // Disabled & Readonly
            disabled && "cursor-not-allowed opacity-50",
            readOnly && "bg-black/5 dark:bg-white/5",
            // Sizes (height)
            size === "sm" && "h-9",
            size === "md" && "h-11",
            size === "lg" && "h-14",
            className,
          )}
        >
          {leftAdornment && (
            <div className="flex items-center pl-3 text-muted">
              {leftAdornment}
            </div>
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
              "fle h-full w-full bg-transparent text-primary outline-none placeholder:text-muted disabled:cursor-not-allowed",
              // Size padding and text
              size === "sm" && "px-3 py-2 text-body-sm",
              size === "md" && "px-4 py-2 text-body-md",
              size === "lg" && "px-4 py-2 text-body-lg",
              leftAdornment && "pl-2",
              rightAdornment && "pr-2",
            )}
            {...props}
          />
          {rightAdornment && (
            <div className="flex items-center pr-3 text-muted">
              {rightAdornment}
            </div>
          )}
        </div>
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
