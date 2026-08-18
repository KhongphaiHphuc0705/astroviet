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
  onBlur?: () => void;
  placeholder?: string;
  label?: string;
  error?: string | boolean;
  helperText?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  searchable?: boolean;
  className?: string;
  id?: string;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      onBlur,
      placeholder = "Select an option...",
      label,
      error,
      helperText,
      disabled,
      required,
      searchable,
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
    const [highlightedValue, setHighlightedValue] = useState<string | null>(
      null,
    );
    const [searchQuery, setSearchQuery] = useState("");
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);
    const listboxRef = useRef<HTMLUListElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const positionStyles = usePosition(triggerRef, isOpen);

    const selectedOption = useMemo(
      () => options.find((opt) => opt.value === value),
      [options, value],
    );

    const filteredOptions = useMemo(() => {
      if (!searchable || !searchQuery) return options;
      return options.filter((o) =>
        o.label.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }, [options, searchable, searchQuery]);

    const handleToggle = () => {
      if (!disabled) setIsOpen((prev) => !prev);
    };

    const handleSelect = (optionValue: string) => {
      onChange?.(optionValue);
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
      if (disabled) return;
      const enabledOptions = filteredOptions.filter((o) => !o.disabled);

      switch (e.key) {
        case "ArrowDown":
        case "ArrowUp": {
          e.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
            return;
          }
          const currentIndex = enabledOptions.findIndex(
            (o) => o.value === highlightedValue,
          );
          let nextIndex = 0;
          if (e.key === "ArrowDown") {
            nextIndex =
              currentIndex < enabledOptions.length - 1 ? currentIndex + 1 : 0;
          } else {
            nextIndex =
              currentIndex > 0 ? currentIndex - 1 : enabledOptions.length - 1;
          }
          setHighlightedValue(enabledOptions[nextIndex]?.value || null);
          break;
        }
        case "Enter": {
          e.preventDefault();
          if (isOpen) {
            if (highlightedValue) handleSelect(highlightedValue);
          } else {
            setIsOpen(true);
          }
          break;
        }
        case " ": {
          if (!isOpen) {
            e.preventDefault();
            setIsOpen(true);
          }
          break;
        }
        case "Escape": {
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        }
        case "Home":
        case "End": {
          if (isOpen) {
            if (e.target !== searchRef.current) {
              e.preventDefault();
              const nextIndex =
                e.key === "Home" ? 0 : enabledOptions.length - 1;
              setHighlightedValue(enabledOptions[nextIndex]?.value || null);
            }
          }
          break;
        }
      }
    };

    useEffect(() => {
      if (isOpen) {
        setSearchQuery("");
        setHighlightedValue(
          value || options.find((o) => !o.disabled)?.value || null,
        );
        if (searchable) {
          setTimeout(() => searchRef.current?.focus(), 0);
        }
      } else {
        if (document.activeElement === searchRef.current) {
          triggerRef.current?.focus();
        }
      }
    }, [isOpen, value, options, searchable]);

    // Close on click outside
    useEffect(() => {
      if (!isOpen) return;
      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if (
          triggerRef.current &&
          !triggerRef.current.contains(e.target as Node) &&
          popupRef.current &&
          !popupRef.current.contains(e.target as Node)
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
      <div className="flex w-full flex-col gap-1.5">
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
            onBlur={onBlur}
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
            onBlur={() => {
              // Only notify RHF that the field was blurred when focus truly leaves
              // the Select. While the dropdown popup is open, focus may move to the
              // listbox/search input — that is NOT a real blur from the user's
              // perspective, so we skip the callback in that case.
              if (!isOpen) onBlur?.();
            }}
            className={cn(
              "h-11 flex w-full items-center justify-between rounded-md border bg-surface px-4 py-2 text-body-md transition-colors focus-visible:outline-none focus-visible:ring-2",
              hasError
                ? "focus-visible:ring-danger/20 border-danger focus-visible:border-danger"
                : "border-strong hover:bg-surface-raised focus-visible:border-accent-secondary focus-visible:ring-focus",
              isOpen &&
                !hasError &&
                "border-accent-secondary ring-2 ring-focus",
              disabled && "cursor-not-allowed opacity-50",
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
                ref={popupRef}
                className="absolute z-dropdown"
                style={{
                  top: positionStyles.top,
                  left: positionStyles.left,
                  width: positionStyles.width,
                }}
              >
                <div className="max-h-60 hidden flex-col overflow-hidden rounded-md border border-subtle bg-surface-raised py-1 shadow-level-3 sm:flex">
                  {searchable && (
                    <div className="mb-1 border-b border-subtle px-3 py-2">
                      <input
                        ref={searchRef}
                        type="text"
                        className="w-full bg-transparent text-body-md text-primary outline-none placeholder:text-muted"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <ul
                    id={`${selectId}-listbox`}
                    ref={listboxRef}
                    role="listbox"
                    data-testid="combobox-listbox"
                    aria-activedescendant={
                      highlightedValue
                        ? `${selectId}-opt-${highlightedValue}`
                        : undefined
                    }
                    tabIndex={-1}
                    className="flex-1 overflow-auto focus:outline-none"
                  >
                    {filteredOptions.length === 0 ? (
                      <div className="py-4 text-center text-body-sm text-muted">
                        No results found.
                      </div>
                    ) : (
                      filteredOptions.map((opt) => {
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
                              "relative flex cursor-pointer select-none items-center py-2 pl-10 pr-4 text-body-md text-primary transition-colors hover:bg-surface-hover",
                              (isSelected || highlightedValue === opt.value) &&
                                "bg-surface-hover",
                              isSelected && "font-medium",
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
                      })
                    )}
                  </ul>
                </div>
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
