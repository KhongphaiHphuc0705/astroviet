import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
} from "react";

import { cn } from "@shared/lib/cn";
import { Label } from "@shared/ui/Label";

export interface SwitchProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  size?: "sm" | "md";
  label?: string;
  description?: ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      className,
      size = "md",
      label,
      description,
      disabled,
      checked,
      id,
      ...props
    },
    ref,
  ) => {
    const internalId = useId();
    const switchId = id || internalId;

    const isSm = size === "sm";

    const trackSize = isSm ? "h-5 w-9" : "h-6 w-11";
    const thumbSize = isSm ? "h-4 w-4" : "h-5 w-5";
    const thumbTranslate = isSm
      ? "peer-checked:translate-x-4"
      : "peer-checked:translate-x-5";

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.currentTarget.click();
      }
      props.onKeyDown?.(e);
    };

    return (
      <div
        className={cn(
          "flex items-start gap-3",
          disabled && "opacity-50",
          className,
        )}
      >
        <div className="relative flex items-center justify-center pt-[3px]">
          <input
            type="checkbox"
            role="switch"
            id={switchId}
            ref={ref}
            checked={checked}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            className="z-10 peer absolute left-1/2 top-1/2 h-hit-area w-hit-area -translate-x-1/2 -translate-y-1/2 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            {...props}
          />
          <div
            className={cn(
              "pointer-events-none flex items-center rounded-full p-[2px] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-focus",
              trackSize,
              "bg-strong peer-checked:bg-accent-secondary",
            )}
          >
            <div
              className={cn(
                "shadow-sm rounded-full bg-surface transition-transform",
                thumbSize,
                thumbTranslate,
              )}
            />
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <Label
                htmlFor={switchId}
                required={props.required}
                className={cn(
                  "cursor-pointer text-body-md normal-case tracking-normal",
                  disabled && "cursor-not-allowed",
                )}
              >
                {label}
              </Label>
            )}
            {description && (
              <div
                className={cn(
                  "text-body-sm text-muted",
                  disabled && "cursor-not-allowed",
                )}
              >
                {description}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

Switch.displayName = "Switch";
