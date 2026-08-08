import {
  forwardRef,
  type TextareaHTMLAttributes,
  type ReactNode,
  useId,
  useRef,
  useState,
  useEffect,
  useCallback,
  type ChangeEvent,
} from "react";

import { cn } from "@shared/lib/cn";
import { Label } from "@shared/ui/Label";

export interface TextareaProps extends Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "size"
> {
  label?: string;
  error?: string | boolean;
  success?: boolean;
  helperText?: ReactNode;
  variant?: "default" | "filled";
  autoResize?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      success,
      helperText,
      variant = "default",
      autoResize,
      id,
      disabled,
      readOnly,
      required,
      maxLength,
      onChange,
      value,
      defaultValue,
      ...props
    },
    ref,
  ) => {
    const internalId = useId();
    const textareaId = id || internalId;
    const descriptionId = `${textareaId}-description`;

    const hasError = !!error;
    const errorMessage = typeof error === "string" ? error : undefined;

    // Counter logic
    const [charCount, setCharCount] = useState(() => {
      if (value !== undefined) return String(value).length;
      if (defaultValue !== undefined) return String(defaultValue).length;
      return 0;
    });

    useEffect(() => {
      if (value !== undefined) {
        setCharCount(String(value).length);
      }
    }, [value]);

    const showDescription = !!errorMessage || !!helperText || !!maxLength;

    // Mobile detection for autoResize default
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
      const mql = window.matchMedia("(max-width: 639px)");
      setIsMobile(mql.matches);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handler = (e: any) => setIsMobile(e.matches);
      if (mql.addEventListener) {
        mql.addEventListener("change", handler);
        return () => mql.removeEventListener("change", handler);
      } else {
        mql.addListener(handler);
        return () => mql.removeListener(handler);
      }
    }, []);

    const effectiveAutoResize = autoResize ?? isMobile;

    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const setRefs = (element: HTMLTextAreaElement | null) => {
      internalRef.current = element;
      if (typeof ref === "function") {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }
    };

    const adjustHeight = useCallback(() => {
      if (effectiveAutoResize && internalRef.current) {
        internalRef.current.style.height = "auto";
        internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
      } else if (!effectiveAutoResize && internalRef.current) {
        internalRef.current.style.height = "";
      }
    }, [effectiveAutoResize]);

    useEffect(() => {
      adjustHeight();
    }, [adjustHeight, value]);

    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (value === undefined) {
        setCharCount(e.target.value.length);
      }
      adjustHeight();
      onChange?.(e);
    };

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label && (
          <Label
            htmlFor={textareaId}
            required={required}
            className={cn(disabled && "cursor-not-allowed opacity-50")}
          >
            {label}
          </Label>
        )}
        <div
          className={cn(
            "relative flex w-full rounded-md border transition-colors focus-within:ring-2",
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
            className,
          )}
        >
          <textarea
            id={textareaId}
            ref={setRefs}
            disabled={disabled}
            readOnly={readOnly}
            required={required}
            maxLength={maxLength}
            aria-invalid={hasError}
            aria-describedby={showDescription ? descriptionId : undefined}
            onChange={handleChange}
            value={value}
            defaultValue={defaultValue}
            className={cn(
              "w-full resize-y bg-transparent p-2 text-body-md text-primary outline-none placeholder:text-muted disabled:cursor-not-allowed",
              effectiveAutoResize && "resize-none overflow-hidden",
            )}
            {...props}
          />
        </div>
        {showDescription && (
          <div
            id={descriptionId}
            className={cn(
              "flex items-start justify-between gap-4 text-body-sm",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {errorMessage || helperText ? (
              <div className={cn(hasError ? "text-danger" : "text-muted")}>
                {errorMessage || helperText}
              </div>
            ) : (
              <div />
            )}
            {!!maxLength && (
              <div
                className="shrink-0 text-muted"
                aria-live="polite"
                aria-atomic="true"
              >
                {charCount} / {maxLength}
              </div>
            )}
          </div>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
