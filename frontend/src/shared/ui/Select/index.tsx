import { ChevronDown, Check } from "lucide-react";
import {
  forwardRef,
  type ReactNode,
  useId,
  useState,
  useRef,
  useEffect,
  useMemo,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { usePosition } from "@shared/hooks/usePosition";
import { cn } from "@shared/lib/cn";
import { Label } from "@shared/ui/Label";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string | boolean;
  helperText?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = "Select an option...",
      label,
      error,
      helperText,
      disabled,
      required,
      className,
      id,
    },
    ref,
  ) => {
    const internalId = useId();
    const selectId = id || internalId;
    const labelId = `${selectId}-label`;
    const descriptionId = `${selectId}-description`;

    const hasError = !!error;
    const errorMessage = typeof error === "string" ? error : undefined;
    const showDescription = !!errorMessage || !!helperText;

    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);

    const positionStyles = usePosition(triggerRef, isOpen);

    const selectedOption = useMemo(
      () => options.find((opt) => opt.value === value),
      [options, value],
    );

    const handleToggle = () => {
      if (!disabled) setIsOpen((prev) => !prev);
    };

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
      if (disabled) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
      // TODO(M6): Full arrow key navigation logic
    };

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node) &&
          listboxRef.current &&
          !listboxRef.current.contains(e.target as Node)
        ) {
          setIsOpen(false);
        }
      };
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, [isOpen]);

    // Handle forwarded ref
    useEffect(() => {
      if (typeof ref === "function") {
        ref(triggerRef.current);
      } else if (ref) {
        ref.current = triggerRef.current;
      }
    }, [ref, triggerRef]);

    const displayValue = selectedOption ? selectedOption.label : placeholder;

    return (
      <div className="gap-1.5 flex w-full flex-col">
        {label && (
          <Label
            id={labelId}
            htmlFor={selectId} // points to the native select ID
            required={required}
            className={cn(disabled && "cursor-not-allowed opacity-50")}
          >
            {label}
          </Label>
        )}

        <div className={cn("relative w-full", className)}>
          {/* Native Select for Mobile (< sm) */}
          {/* M5 Plan / Micro Spec: Hidden on desktop, takes full height/width on mobile, catching taps natively */}
          <select
            id={selectId}
            disabled={disabled}
            required={required}
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            aria-invalid={hasError}
            aria-describedby={showDescription ? descriptionId : undefined}
            data-testid="native-select"
            className={cn(
              "z-10 absolute inset-0 h-full w-full cursor-pointer opacity-0 sm:hidden",
              disabled && "cursor-not-allowed",
            )}
          >
            <option value="" disabled hidden>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Custom Combobox for Desktop (>= sm) */}
          <button
            ref={triggerRef}
            type="button"
            role="combobox"
            disabled={disabled}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={isOpen ? `${selectId}-listbox` : undefined}
            aria-labelledby={`${labelId} ${selectId}-value`}
            aria-invalid={hasError}
            aria-describedby={showDescription ? descriptionId : undefined}
            data-testid="combobox-trigger"
            onClick={handleToggle}
            onKeyDown={handleKeyDown}
            className={cn(
              "h-11 flex w-full items-center justify-between rounded-md border bg-surface px-4 text-body-md transition-colors focus-visible:outline-none focus-visible:ring-2",
              hasError
                ? "focus-visible:ring-danger/20 border-danger focus-visible:border-danger"
                : "border-strong hover:bg-surface-raised focus-visible:border-accent-secondary focus-visible:ring-focus",
              isOpen &&
                !hasError &&
                "border-accent-secondary ring-2 ring-focus",
              disabled &&
                "bg-black/5 dark:bg-white/5 hover:bg-black/5 dark:hover:bg-white/5 cursor-not-allowed opacity-50",
              !selectedOption && "text-muted",
              "text-primary",
            )}
          >
            <span id={`${selectId}-value`} className="truncate">
              {displayValue}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted transition-transform duration-fast",
                isOpen && "rotate-180",
              )}
            />
          </button>

          {/* Portal for Listbox (Combobox Pattern) */}
          {isOpen &&
            createPortal(
              <div
                className="absolute z-dropdown"
                style={{
                  top: positionStyles.top,
                  left: positionStyles.left,
                  width: positionStyles.width,
                }}
              >
                <ul
                  id={`${selectId}-listbox`}
                  ref={listboxRef}
                  role="listbox"
                  data-testid="combobox-listbox"
                  aria-activedescendant={
                    value ? `${selectId}-opt-${value}` : undefined
                  }
                  tabIndex={-1}
                  // Hide entirely on mobile viewport, native select handles UI
                  className="max-h-60 hidden overflow-auto rounded-md border border-subtle bg-surface-raised py-1 shadow-level-3 focus:outline-none sm:block"
                >
                  {options.map((opt) => {
                    const isSelected = value === opt.value;
                    return (
                      <li
                        key={opt.value}
                        id={`${selectId}-opt-${opt.value}`}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={opt.disabled}
                        onClick={() => {
                          if (!opt.disabled) handleSelect(opt.value);
                        }}
                        onKeyDown={() => {}}
                        className={cn(
                          "hover:bg-surface-hover relative flex cursor-pointer select-none items-center py-2 pl-10 pr-4 text-body-md text-primary transition-colors",
                          isSelected && "bg-surface-hover font-medium",
                          opt.disabled &&
                            "cursor-not-allowed opacity-50 hover:bg-transparent",
                        )}
                      >
                        {isSelected && (
                          <span className="absolute left-3 flex h-4 w-4 items-center justify-center text-accent-primary">
                            <Check className="h-4 w-4" />
                          </span>
                        )}
                        <span className="truncate">{opt.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>,
              document.body,
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

Select.displayName = "Select";
