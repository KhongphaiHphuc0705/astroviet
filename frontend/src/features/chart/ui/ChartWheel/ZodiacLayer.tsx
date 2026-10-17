import { WHEEL_CENTER, WHEEL_RADII } from "../../model/geometry";
import type { WheelSignCell } from "../../model/wheelGeometry";

export interface ZodiacLayerProps {
  signs: WheelSignCell[];
  center?: number;
  radii?: typeof WHEEL_RADII;
}

/**
 * Renders the zodiac ring layer:
 * - Concentric outer and inner ring borders
 * - 12 zodiac sign cells with annular sector paths
 * - 12 boundary lines between signs
 * - 12 zodiac glyph texts positioned at mid-radius
 */
export function ZodiacLayer({
  signs,
  center = WHEEL_CENTER,
  radii = WHEEL_RADII,
}: ZodiacLayerProps) {
  return (
    <g data-layer="zodiac-ring" aria-hidden="true">
      {/* Concentric boundary rings */}
      <circle
        cx={center}
        cy={center}
        r={radii.signOuter}
        fill="none"
        className="stroke-strong"
        strokeWidth={1.5}
      />
      <circle
        cx={center}
        cy={center}
        r={radii.signInner}
        fill="none"
        className="stroke-strong"
        strokeWidth={1.5}
      />

      {/* 12 zodiac sign cells */}
      {signs.map((sign) => (
        <g key={sign.key} data-sign={sign.key}>
          {/* Đường bao ô cung (arcPath): hiện fill="none" không stroke để dành làm vùng hit-area / tương tác chọn cung cho S4.8 */}
          <path d={sign.path} fill="none" />
          <line
            x1={sign.boundary.x1}
            y1={sign.boundary.y1}
            x2={sign.boundary.x2}
            y2={sign.boundary.y2}
            className="stroke-subtle"
            strokeWidth={1}
          />
          {sign.glyph ? (
            <text
              x={sign.glyphPoint.x}
              y={sign.glyphPoint.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={18}
              className="fill-primary font-display"
              aria-hidden="true"
            >
              {sign.glyph}
            </text>
          ) : null}
        </g>
      ))}
    </g>
  );
}
