import { useEffect, useRef } from "react";

const FOCUSABLE_ELEMENTS =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface UseFocusTrapOptions {
  active: boolean;
  onEscape?: () => void;
  initialFocusRef?: React.RefObject<HTMLElement>;
}

export function useFocusTrap({
  active,
  onEscape,
  initialFocusRef,
}: UseFocusTrapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onEscapeRef = useRef(onEscape);

  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;

    // Save previous focus ONLY when first activated
    if (!previousFocusRef.current) {
      previousFocusRef.current = document.activeElement as HTMLElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Small delay to ensure render is complete before focusing
    const focusTimeout = setTimeout(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        const focusableElements =
          container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
        if (focusableElements.length > 0) {
          focusableElements[0]?.focus();
        } else {
          container.focus(); // container itself needs tabIndex={-1} for this to work
        }
      }
    }, 10);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onEscapeRef.current?.();
        return;
      }

      if (e.key === "Tab") {
        const focusableElements = Array.from(
          container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS),
        );

        if (focusableElements.length === 0) {
          e.preventDefault();
          return;
        }

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (
            document.activeElement === firstElement ||
            document.activeElement === container
          ) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener("keydown", handleKeyDown);
      // Restore focus
      const elToFocus = previousFocusRef.current;
      previousFocusRef.current = null;
      if (elToFocus) {
        // another slight delay so focus isn't lost during react unmount batching
        setTimeout(() => {
          elToFocus.focus();
        }, 10);
      }
    };
  }, [active, initialFocusRef]);

  return containerRef;
}
