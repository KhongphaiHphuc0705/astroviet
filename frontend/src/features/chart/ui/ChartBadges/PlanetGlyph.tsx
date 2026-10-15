import { cn } from "@shared/lib/cn";

import { RETROGRADE_GLYPH, type GlyphLabel } from "../../model/labels";

export interface PlanetGlyphProps {
  planet: GlyphLabel;
  retrograde?: boolean;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PlanetGlyph({
  planet,
  retrograde = false,
  showLabel = true,
  size = "md",
  className,
}: PlanetGlyphProps) {
  const accessibleName = retrograde
    ? `${planet.labelVi}, nghịch hành`
    : planet.labelVi;

  const sizeClasses = {
    sm: "text-body-sm gap-1",
    md: "text-body-md gap-1.5",
    lg: "text-heading-sm gap-2",
  }[size];

  if (!showLabel) {
    return (
      <span
        role="img"
        aria-label={accessibleName}
        className={cn("inline-flex items-center", sizeClasses, className)}
      >
        {planet.glyph && (
          <span aria-hidden="true" className="shrink-0 font-display">
            {planet.glyph}
          </span>
        )}
        {retrograde && (
          <span
            aria-hidden="true"
            className="shrink-0 font-display text-accent-primary"
          >
            {RETROGRADE_GLYPH}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center", sizeClasses, className)}>
      {planet.glyph && (
        <span aria-hidden="true" className="shrink-0 font-display">
          {planet.glyph}
        </span>
      )}
      <span className="truncate">{planet.labelVi}</span>
      {retrograde && (
        <>
          <span
            aria-hidden="true"
            className="shrink-0 font-display text-accent-primary"
          >
            {RETROGRADE_GLYPH}
          </span>
          <span className="sr-only">, nghịch hành</span>
        </>
      )}
    </span>
  );
}
