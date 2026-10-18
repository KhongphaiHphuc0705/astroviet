import { cn } from "@shared/lib/cn";

import type { AspectLegendEntry } from "../../model/aspectGeometry";
import type { NatureTone } from "../../model/labels";

export interface AspectLegendProps {
  legend: AspectLegendEntry[];
  className?: string;
}

const TONE_STROKE_CLASSES: Record<NatureTone, string> = {
  harmonious: "stroke-accent-secondary",
  tense: "stroke-accent-primary",
  neutral: "stroke-secondary",
  unknown: "stroke-muted",
};

/**
 * AspectLegend: semantic data-driven legend explaining rendered aspect line patterns and nature groups.
 * Rendered below the visibility toggle switch outside the SVG canvas.
 * Only includes aspect types that are actually rendered on the current wheel.
 */
export function AspectLegend({ legend, className }: AspectLegendProps) {
  if (legend.length === 0) {
    return null;
  }

  return (
    <ul
      aria-label="Chú giải kiểu đường góc chiếu"
      className={cn(
        "flex flex-wrap items-center gap-x-5 gap-y-2 text-body-sm text-secondary",
        className,
      )}
    >
      {legend.map((entry) => (
        <li
          key={entry.typeKey}
          data-type={entry.typeKey}
          data-nature={entry.natureKey}
          className="inline-flex items-center gap-2"
        >
          <svg
            aria-hidden="true"
            width={40}
            height={8}
            viewBox="0 0 40 8"
            className="shrink-0"
          >
            <line
              x1={2}
              y1={4}
              x2={38}
              y2={4}
              strokeWidth={entry.style.width}
              strokeDasharray={entry.style.dasharray ?? undefined}
              strokeLinecap={entry.style.linecap}
              className={TONE_STROKE_CLASSES[entry.natureTone]}
            />
          </svg>
          <span>
            {entry.typeLabelVi} ({entry.natureLabelVi}) —{" "}
            {entry.style.patternLabelVi}
          </span>
        </li>
      ))}
    </ul>
  );
}
