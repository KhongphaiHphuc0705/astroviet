import { cn } from "@shared/lib/cn";

import type { GlyphLabel, NatureLabel } from "../../model/labels";

export interface AspectBadgeProps {
  type: GlyphLabel;
  nature: NatureLabel;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function AspectBadge({
  type,
  nature,
  showLabel = true,
  size = "md",
  className,
}: AspectBadgeProps) {
  const tone = nature.tone;

  const toneDotClasses = {
    harmonious: "bg-accent-secondary",
    tense: "bg-accent-primary",
    neutral: "bg-secondary",
    unknown: "bg-muted",
  }[tone];

  const toneBorderClasses = {
    harmonious: "border-accent-secondary/40",
    tense: "border-accent-primary/40",
    neutral: "border-subtle",
    unknown: "border-subtle",
  }[tone];

  const sizeClasses = {
    sm: "h-5 gap-1 px-2 text-label",
    md: "h-6 gap-1.5 px-2.5 text-body-sm",
    lg: "h-7 gap-2 px-3 text-body-md",
  }[size];

  const natureDescription = nature.labelVi ? nature.labelVi.toLowerCase() : "";
  const accessibleName = natureDescription
    ? `${type.labelVi}, ${natureDescription}`
    : type.labelVi;

  if (!showLabel) {
    return (
      <span
        role="img"
        aria-label={accessibleName}
        data-tone={tone}
        className={cn(
          "inline-flex items-center justify-center rounded-full border bg-surface-raised font-medium text-primary",
          toneBorderClasses,
          sizeClasses,
          className,
        )}
      >
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDotClasses)}
          aria-hidden="true"
        />
        {type.glyph && (
          <span aria-hidden="true" className="shrink-0 font-display">
            {type.glyph}
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      data-tone={tone}
      className={cn(
        "inline-flex items-center justify-center rounded-full border bg-surface-raised font-medium text-primary",
        toneBorderClasses,
        sizeClasses,
        className,
      )}
    >
      <span
        className={cn("h-1.5 w-1.5 shrink-0 rounded-full", toneDotClasses)}
        aria-hidden="true"
      />
      {type.glyph && (
        <span aria-hidden="true" className="shrink-0 font-display">
          {type.glyph}
        </span>
      )}
      <span className="truncate">{type.labelVi}</span>
      {natureDescription && (
        <span className="sr-only">, {natureDescription}</span>
      )}
    </span>
  );
}
