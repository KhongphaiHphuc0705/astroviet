import { WHEEL_CENTER, WHEEL_RADII } from "../../model/geometry";
import type { WheelHouseSpoke } from "../../model/wheelGeometry";

export interface HouseLayerProps {
  houses: WheelHouseSpoke[] | null;
  center?: number;
  radii?: typeof WHEEL_RADII;
}

/**
 * Renders the house ring layer when house data is available:
 * - Concentric house boundary circles [215, 175]
 * - 12 radial house cusp lines (spokes) extending from r=175 to r=225
 * - 12 house number labels centered in their respective sectors at r=195
 *
 * If houses is null or empty, this layer renders nothing (no DOM group).
 */
export function HouseLayer({
  houses,
  center = WHEEL_CENTER,
  radii = WHEEL_RADII,
}: HouseLayerProps) {
  if (!houses || houses.length === 0) {
    return null;
  }

  return (
    <g data-layer="house-ring" aria-hidden="true">
      {/* Concentric house ring boundary circles */}
      <circle
        cx={center}
        cy={center}
        r={radii.houseOuter}
        fill="none"
        className="stroke-subtle"
        strokeWidth={1}
      />
      <circle
        cx={center}
        cy={center}
        r={radii.houseInner}
        fill="none"
        className="stroke-subtle"
        strokeWidth={1}
      />

      {/* 12 house cusp spokes and number labels */}
      {houses.map((house) => (
        <g key={house.number} data-house={house.number}>
          <line
            x1={house.cusp.x1}
            y1={house.cusp.y1}
            x2={house.cusp.x2}
            y2={house.cusp.y2}
            className="stroke-subtle"
            strokeWidth={1}
          />
          <text
            x={house.labelPoint.x}
            y={house.labelPoint.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={16}
            className="fill-secondary font-data"
            aria-hidden="true"
          >
            {house.number}
          </text>
        </g>
      ))}
    </g>
  );
}
