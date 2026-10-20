import type { AspectGeometryResult } from "../../model/aspectGeometry";
import { WHEEL_CENTER } from "../../model/geometry";

import { TONE_FILL_CLASSES, TONE_STROKE_CLASSES } from "./aspectStyles";

export interface AspectLayerProps {
  geometry: AspectGeometryResult;
  center?: number;
}

/**
 * AspectLayer: SVG rendering of astrological aspect lines and Conjunction arcs/dots.
 * Rendered within ChartWheel underneath the planet bodies.
 * Purely presentational (aria-hidden="true", pointer-events-none).
 * All interaction/selection is deferred to Sprint F4 S4.8.
 */
export function AspectLayer({
  geometry,
  center = WHEEL_CENTER,
}: AspectLayerProps) {
  if (geometry.lines.length === 0) {
    return null;
  }

  return (
    <g data-layer="aspects" aria-hidden="true" className="pointer-events-none">
      {/* Reference anchor ring at aspectRing radius */}
      <circle
        data-part="aspect-ring"
        cx={center}
        cy={center}
        r={geometry.ringRadius}
        fill="none"
        className="stroke-subtle"
        strokeWidth={1}
      />

      {/* Aspect lines sorted by orb desc, key asc */}
      {geometry.lines.map((l) => {
        if (l.shape === "dot") {
          return (
            <circle
              key={l.key}
              data-aspect={l.key}
              data-type={l.typeKey}
              data-nature={l.natureKey}
              data-shape="dot"
              cx={l.start.x}
              cy={l.start.y}
              r={l.style.width / 2}
              className={TONE_FILL_CLASSES[l.natureTone]}
            />
          );
        }

        return (
          <path
            key={l.key}
            data-aspect={l.key}
            data-type={l.typeKey}
            data-nature={l.natureKey}
            data-shape={l.shape}
            d={l.d ?? undefined}
            fill="none"
            className={TONE_STROKE_CLASSES[l.natureTone]}
            strokeWidth={l.style.width}
            strokeDasharray={l.style.dasharray ?? undefined}
            strokeLinecap={l.style.linecap}
          />
        );
      })}
    </g>
  );
}
