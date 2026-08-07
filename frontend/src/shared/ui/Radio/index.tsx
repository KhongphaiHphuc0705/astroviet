import {
  forwardRef,
  type ReactNode,
  useId,
  useState,
  type ChangeEvent,
} from "react";

import { cn } from "@shared/lib/cn";
import { Card } from "@shared/ui/Card";
import { Label } from "@shared/ui/Label";

export interface RadioOption {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioOption[];
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  error?: string | boolean;
  helperText?: ReactNode;
  orientation?: "horizontal" | "vertical";
  variant?: "default" | "card"; // TODO(M6): Refine card variant styles with proper icons/layout
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export const RadioGroup = forwardRef<HTMLDivElement, RadioGroupProps>(
  (
    {
      options,
      name,
      value,
      defaultValue,
      onChange,
      label,
      error,
      helperText,
      orientation = "vertical",
      variant = "default",
      required,
      disabled,
      className,
      id,
    },
    ref,
  ) => {
    const internalId = useId();
    const groupId = id || internalId;
    const labelId = `${groupId}-label`;
    const descriptionId = `${groupId}-description`;
    const radioName = name || groupId;

    const hasError = !!error;
    const errorMessage = typeof error === "string" ? error : undefined;
    const showDescription = !!errorMessage || !!helperText;

    const [internalValue, setInternalValue] = useState(defaultValue);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const handleOptionChange = (e: ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalValue(e.target.value);
      }
      onChange?.(e.target.value);
    };

    // Auto-switch orientation logic (Micro Spec §6.8)
    const isHorizontal = orientation === "horizontal";
    // không auto-switch nếu chỉ có <= 2 option
    const autoSwitch = isHorizontal && options.length > 2;

    const groupClasses = cn(
      "flex",
      !isHorizontal && "flex-col gap-2",
      isHorizontal && !autoSwitch && "flex-row gap-6",
      isHorizontal && autoSwitch && "flex-col gap-2 sm:flex-row sm:gap-6",
      variant === "card" && "gap-4 sm:gap-4", // Override gap for cards
    );

    return (
      <div
        ref={ref}
        role="radiogroup"
        aria-labelledby={label ? labelId : undefined}
        aria-invalid={hasError}
        aria-describedby={showDescription ? descriptionId : undefined}
        className={cn("flex flex-col gap-2", className)}
      >
        {label && (
          <Label
            id={labelId}
            htmlFor={options.length > 0 ? `${groupId}-opt-0` : ""}
            required={required}
            className={cn(disabled && "cursor-not-allowed opacity-50")}
          >
            {label}
          </Label>
        )}

        <div className={groupClasses} data-testid="radiogroup-inner">
          {options.map((option, index) => {
            const optionId = `${groupId}-opt-${index}`;
            const optionDisabled = disabled || option.disabled;
            const isChecked = currentValue === option.value;

            const innerContent = (
              <>
                <div className="relative flex min-h-hit-area items-center justify-center">
                  <input
                    type="radio"
                    id={optionId}
                    name={radioName}
                    value={option.value}
                    checked={isChecked}
                    onChange={handleOptionChange}
                    disabled={optionDisabled}
                    className="peer sr-only"
                  />
                  <div
                    className={cn(
                      "flex h-control-md w-control-md items-center justify-center rounded-full border bg-canvas transition-colors duration-fast",
                      hasError
                        ? "peer-focus-visible:ring-danger/20 border-danger"
                        : "border-strong peer-focus-visible:border-accent-secondary peer-focus-visible:ring-focus",
                      "peer-checked:border-accent-primary peer-checked:bg-accent-primary",
                      "peer-focus-visible:ring-2 peer-focus-visible:ring-offset-1 peer-focus-visible:ring-offset-canvas",
                    )}
                  >
                    <div className="h-2 w-2 scale-0 rounded-full bg-on-accent transition-transform duration-fast peer-checked:scale-100" />
                  </div>
                </div>

                <div className="flex min-h-hit-area flex-col justify-center py-1">
                  <span className="text-body-md font-medium text-primary">
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-body-sm text-muted">
                      {option.description}
                    </span>
                  )}
                </div>
              </>
            );

            if (variant === "card") {
              return (
                <label
                  key={option.value}
                  htmlFor={optionId}
                  className={cn(
                    "relative flex flex-1",
                    optionDisabled
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer",
                  )}
                >
                  <Card
                    className={cn(
                      "flex flex-1 items-start gap-3 px-4 py-2 transition-colors",
                      !optionDisabled &&
                        "focus-within:border-accent-primary focus-within:ring-2 focus-within:ring-focus hover:bg-surface-raised",
                      isChecked &&
                        "border-accent-primary bg-surface-raised ring-1 ring-accent-primary",
                    )}
                  >
                    {innerContent}
                  </Card>
                </label>
              );
            }

            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={cn(
                  "relative flex items-start gap-3",
                  optionDisabled
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer",
                )}
              >
                {innerContent}
              </label>
            );
          })}
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

RadioGroup.displayName = "RadioGroup";
