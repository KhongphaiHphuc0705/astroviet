import { WHEEL_CENTER, WHEEL_RADII } from "../../model/geometry";
import type { PlanetWheelModel } from "../../model/planetGeometry";

export interface PlanetLayerProps {
  model: PlanetWheelModel;
  center?: number;
  radii?: typeof WHEEL_RADII;
}

/**
 * Renders the planet visualization layer on the Chart Wheel:
 * - Baseline circle (r=175) when !hasHouses (D-S45-02)
 * - Marks: True position markers at r: 175 -> 168 and leader connector lines
 * - Labels: Accessible planet groups (role="img", aria-label) containing glyph,
 *   optional retrograde indicator ℞, and degree text (Tier A).
 * - Non-interactive (no role="button", tabIndex, or event handlers reserved for S4.8).
 */
export function PlanetLayer({
  model,
  center = WHEEL_CENTER,
}: PlanetLayerProps) {
  if (model.planets.length === 0) {
    return null;
  }

  return (
    <g data-layer="planets" data-label-tier={model.tier}>
      {/* Baseline circle: only rendered when chart does not have house cusps */}
      {!model.hasHouses && (
        <circle
          data-part="baseline"
          cx={center}
          cy={center}
          r={model.baselineRadius}
          fill="none"
          className="stroke-subtle"
          strokeWidth={1}
          aria-hidden="true"
        />
      )}

      {/* Decorative marks: leaders and true position markers */}
      <g data-part="marks" aria-hidden="true">
        {/* Leader connector lines (only for displaced labels with gap > 4) */}
        {model.planets.map((item) => {
          if (!item.leader) return null;
          return (
            <line
              key={`leader-${item.id}`}
              data-part="leader"
              data-planet={item.id}
              x1={item.leader.x1}
              y1={item.leader.y1}
              x2={item.leader.x2}
              y2={item.leader.y2}
              className="stroke-subtle"
              strokeWidth={1}
            />
          );
        })}

        {/* True position marker ticks (always anchored at r: 175 -> 168) */}
        {model.planets.map((item) => (
          <line
            key={`marker-${item.id}`}
            data-part="marker"
            data-planet={item.id}
            x1={item.markerInner.x}
            y1={item.markerInner.y}
            x2={item.markerOuter.x}
            y2={item.markerOuter.y}
            className="stroke-strong"
            strokeWidth={1.5}
          />
        ))}
      </g>

      {/* Accessible planet label groups */}
      {model.status !== "overflow" && (
        <g data-part="labels">
          {model.planets.map((item) => (
            <g
              key={item.id}
              data-planet={item.id}
              role="img"
              aria-label={item.ariaLabel}
            >
              <text
                data-part="glyph"
                x={item.glyphPoint.x}
                y={item.glyphPoint.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={18}
                className="select-none fill-primary font-display"
                aria-hidden="true"
              >
                {item.glyph ?? item.fallbackText}
              </text>

              {item.isRetrograde && item.retrogradePoint && (
                <text
                  data-part="retrograde"
                  x={item.retrogradePoint.x}
                  y={item.retrogradePoint.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={16}
                  className="select-none fill-primary font-display"
                  aria-hidden="true"
                >
                  ℞
                </text>
              )}

              {item.degreeText && item.degreePoint && (
                <text
                  data-part="degree"
                  x={item.degreePoint.x}
                  y={item.degreePoint.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={16}
                  className="select-none fill-primary font-data"
                  aria-hidden="true"
                >
                  {item.degreeText}
                </text>
              )}
            </g>
          ))}
        </g>
      )}
    </g>
  );
}
