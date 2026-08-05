import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useId,
  useState,
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
      checked: controlledChecked,
      defaultChecked,
      onChange,
      id,
      ...props
    },
    ref,
  ) => {
    const internalId = useId();
    const switchId = id || internalId;

    const [internalChecked, setInternalChecked] = useState(!!defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalChecked(e.target.checked);
      }
      onChange?.(e);
    };

    const isSm = size === "sm";

    const trackSize = isSm ? "h-5 w-10" : "h-6 w-hit-area";
    const thumbSize = isSm ? "h-4 w-4" : "h-5 w-5";
    const thumbTranslate = checked ? "translate-x-5" : "translate-x-0";

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
            onChange={handleChange}
            disabled={disabled}
            onKeyDown={handleKeyDown}
            className="z-10 peer absolute left-1/2 top-1/2 h-hit-area w-hit-area -translate-x-1/2 -translate-y-1/2 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            {...props}
          />
          <div
            className={cn(
              "pointer-events-none flex shrink-0 items-center rounded-full p-[2px] transition-colors duration-fast ease-standard peer-focus-visible:ring-2 peer-focus-visible:ring-focus",
              trackSize,
              checked ? "bg-accent-secondary" : "bg-strong",
            )}
          >
            <div
              className={cn(
                "shadow-sm rounded-full bg-surface transition-transform duration-fast ease-standard",
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
