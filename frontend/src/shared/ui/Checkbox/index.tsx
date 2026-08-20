import { Check, Minus } from "lucide-react";
import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
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
  // TODO(Core): Thêm error/helperText prop cho Checkbox khi có >= 2 form thật cần dùng
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
      checked: controlledChecked,
      defaultChecked,
      onChange,
      id,
      ...props
    },
    ref,
  ) => {
    const internalId = useId();
    const checkboxId = id || internalId;

    const [internalChecked, setInternalChecked] = useState(!!defaultChecked);
    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : internalChecked;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) {
        setInternalChecked(e.target.checked);
      }
      onChange?.(e);
    };

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
    const boxSize = isSm
      ? "h-control-sm w-control-sm"
      : "h-control-md w-control-md";
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
            onChange={handleChange}
            disabled={disabled}
            className="z-10 peer absolute left-1/2 top-1/2 h-hit-area w-hit-area -translate-x-1/2 -translate-y-1/2 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            {...props}
          />
          <div
            className={cn(
              "pointer-events-none flex items-center justify-center rounded-sm border transition-colors duration-fast peer-focus-visible:ring-2 peer-focus-visible:ring-focus",
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
