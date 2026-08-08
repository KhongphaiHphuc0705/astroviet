import { X } from "lucide-react";
import { type ReactNode, useId, useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { useFocusTrap } from "@shared/hooks/useFocusTrap";
import { useMountAnimation } from "@shared/hooks/useMountAnimation";
import { cn } from "@shared/lib/cn";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  variant?: "default" | "danger";
  size?: "sm" | "md" | "lg" | "fullscreen";
  closeOnOverlayClick?: boolean;
}

const sizeClasses = {
  sm: "w-full max-w-modal-sm",
  md: "w-full max-w-modal-md max-sm:w-full max-sm:max-w-none max-sm:h-[100dvh] max-sm:rounded-none max-sm:border-none",
  lg: "w-full max-w-modal-lg max-sm:w-full max-sm:max-w-none max-sm:h-[100dvh] max-sm:rounded-none max-sm:border-none",
  fullscreen: "w-full max-w-none h-[100dvh] rounded-none border-none",
};

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "default",
  size = "md",
  closeOnOverlayClick = true,
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const animationState = useMountAnimation(isOpen, 320);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleEscape = () => {
    onClose();
  };

  const trapRef = useFocusTrap({
    active: mounted && animationState !== "closed",
    onEscape: handleEscape,
  });

  const titleId = useId();
  const descId = useId();

  if (!mounted || animationState === "closed") return null;

  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) {
    console.warn("modal-root not found in document");
    return null;
  }

  const isClosing = animationState === "closing" || !isOpen;

  return createPortal(
    <div className="fixed inset-0 z-modal-overlay flex items-center justify-center p-4 max-sm:p-0">
      {/* Overlay Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-overlay backdrop-blur-sm transition-opacity duration-slow",
          isClosing ? "opacity-0" : "opacity-100",
        )}
        onClick={() => {
          if (closeOnOverlayClick) onClose();
        }}
        aria-hidden="true"
        data-testid="modal-overlay"
      />

      {/* Modal Container */}
      <div
        ref={trapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-modal flex max-h-[100dvh] flex-col overflow-hidden rounded-md border border-subtle bg-surface shadow-level-3 transition-all duration-slow",
          sizeClasses[size],
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100",
        )}
        data-testid="modal-container"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between border-b border-subtle px-6 py-4">
          <div className="flex flex-col gap-1 pr-6">
            <h2
              id={titleId}
              className={cn(
                "font-display text-heading-md font-semibold",
                variant === "danger" ? "text-danger" : "text-primary",
              )}
            >
              {title}
            </h2>
            {description && (
              <p id={descId} className="text-body-sm text-secondary">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="absolute right-4 top-4 rounded-sm p-1 text-secondary opacity-70 ring-offset-surface transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-focus focus:ring-offset-2"
            data-testid="modal-close-btn"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        {children && (
          <div className="flex-1 overflow-y-auto px-6 py-4">{children}</div>
        )}

        {/* Footer */}
        {footer && (
          <div className="flex shrink-0 items-center justify-end gap-3 border-t border-subtle bg-surface-hover px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    modalRoot,
  );
}
