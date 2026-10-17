import type { WheelAngleMarker } from "../../model/wheelGeometry";

export interface AngleLayerProps {
  angles: WheelAngleMarker[];
}

/**
 * Renders recognized cardinal angle markers:
 * - Up to 4 angle axes (Ascendant, Midheaven, Descendant, ImumCoeli)
 * - Radial axis lines from r=175 to r=260 (stroke-strong, 2.5px width)
 * - Text labels positioned at r=282 with accessible aria-label
 */
export function AngleLayer({ angles }: AngleLayerProps) {
  return (
    <g data-layer="angle-markers">
      {angles.map((angle) => (
        <g key={angle.key} data-angle={angle.key}>
          <line
            x1={angle.line.x1}
            y1={angle.line.y1}
            x2={angle.line.x2}
            y2={angle.line.y2}
            className="stroke-strong"
            strokeWidth={2.5}
          />
          <text
            x={angle.labelPoint.x}
            y={angle.labelPoint.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={16}
            className="fill-primary font-data font-bold"
            role="img"
            aria-label={angle.ariaLabel}
          >
            {angle.shortLabel}
          </text>
        </g>
      ))}
    </g>
  );
}
