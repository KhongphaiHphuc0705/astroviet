import type { LabelHTMLAttributes, ReactNode } from "react";

import { cn } from "@shared/lib/cn";

type BaseLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode;
  htmlFor: string; // Bắt buộc
};

// Loại trừ lẫn nhau: không thể vừa required vừa optional
type RequiredOrOptional =
  | { required?: boolean; optional?: never }
  | { required?: never; optional?: boolean };

export type LabelProps = BaseLabelProps & RequiredOrOptional;

export function Label({
  children,
  className,
  required,
  optional,
  ...props
}: LabelProps) {
  return (
    <label
      className={cn(
        "flex items-center gap-1 text-label uppercase text-primary",
        className,
      )}
      {...props}
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-danger" title="Bắt buộc">
          *
        </span>
      )}
      {optional && (
        <span className="text-body-sm normal-case tracking-normal text-muted">
          (Tùy chọn)
        </span>
      )}
    </label>
  );
}
