import { cn } from "@shared/lib/cn";

import type { GlyphLabel } from "../../model/labels";

export interface SignGlyphProps {
  sign: GlyphLabel;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function SignGlyph({
  sign,
  showLabel = true,
  size = "md",
  className,
}: SignGlyphProps) {
  const sizeClasses = {
    sm: "text-body-sm gap-1",
    md: "text-body-md gap-1.5",
    lg: "text-heading-sm gap-2",
  }[size];

  if (!showLabel) {
    return (
      <span
        role="img"
        aria-label={sign.labelVi}
        className={cn("inline-flex items-center", sizeClasses, className)}
      >
        {sign.glyph && (
          <span aria-hidden="true" className="shrink-0 font-display">
            {sign.glyph}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center", sizeClasses, className)}>
      {sign.glyph && (
        <span aria-hidden="true" className="shrink-0 font-display">
          {sign.glyph}
        </span>
      )}
      <span className="truncate">{sign.labelVi}</span>
    </span>
  );
}
