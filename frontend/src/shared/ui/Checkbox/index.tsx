import { Check, Minus } from "lucide-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from "react";

import { cn } from "@shared/lib/cn";
import { Label } from "@shared/ui/Label";

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  size?: "sm" | "md";
  label?: string;
  description?: ReactNode;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className,
      size = "md",
      label,
      description,
      indeterminate = false,
      disabled,
      checked,
      id,
      ...props
    },
    ref,
  ) => {
    const internalId = useId();
    const checkboxId = id || internalId;

    const innerRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (innerRef.current) {
        innerRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const setRefs = (element: HTMLInputElement | null) => {
      innerRef.current = element;
      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    const isSm = size === "sm";
    const boxSize = isSm ? "h-4 w-4" : "h-[18px] w-[18px]";
    const iconSize = isSm ? 12 : 14;

    const showCheckedIcon = checked && !indeterminate;
    const showIndeterminateIcon = indeterminate;

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
            id={checkboxId}
            ref={setRefs}
            checked={checked}
            disabled={disabled}
            className="z-10 peer absolute left-1/2 top-1/2 h-[44px] w-[44px] -translate-x-1/2 -translate-y-1/2 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            {...props}
          />
          <div
            className={cn(
              "pointer-events-none flex items-center justify-center rounded-sm border transition-colors",
              boxSize,
              checked || indeterminate
                ? "border-accent-secondary bg-accent-secondary text-canvas"
                : "border-strong bg-surface",
            )}
          >
            {showIndeterminateIcon && <Minus size={iconSize} strokeWidth={3} />}
            {showCheckedIcon && <Check size={iconSize} strokeWidth={3} />}
          </div>
        </div>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <Label
                htmlFor={checkboxId}
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

Checkbox.displayName = "Checkbox";
