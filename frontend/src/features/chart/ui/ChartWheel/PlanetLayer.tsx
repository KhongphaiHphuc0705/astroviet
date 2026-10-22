import { cn } from "@shared/lib/cn";

import { WHEEL_CENTER } from "../../model/geometry";
import { PLANET_TEXT_SIZES } from "../../model/labelLayout";
import type {
  PlanetRenderItem,
  PlanetWheelModel,
} from "../../model/planetGeometry";
import type { WheelInteraction } from "../../model/selection";

export interface PlanetLayerProps {
  model: PlanetWheelModel;
  center?: number;
  interaction?: WheelInteraction;
}

/**
 * Renders the planet visualization layer on the Chart Wheel:
 * - Baseline circle (r=175) when !hasHouses (D-S45-02)
 * - Marks: True position markers at r: 175 -> 168 and leader connector lines
 * - Labels:
 *   - Static mode (!interaction): role="img", aria-label (M5 preservation)
 *   - Interactive mode (interaction): role="button", tabIndex=0, aria-pressed,
 *     keyboard/mouse/touch handlers, focus ring, selected/related halo, and dimming (M8 Task 3).
 */
export function PlanetLayer({
  model,
  center = WHEEL_CENTER,
  interaction,
}: PlanetLayerProps) {
  if (model.planets.length === 0) {
    return null;
  }

  function renderPlanetContent(item: PlanetRenderItem) {
    if (model.status === "overflow") {
      return null;
    }

    return (
      <>
        <text
          data-part="glyph"
          x={item.glyphPoint.x}
          y={item.glyphPoint.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={PLANET_TEXT_SIZES.glyph}
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
            fontSize={PLANET_TEXT_SIZES.retrograde}
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
            fontSize={PLANET_TEXT_SIZES.degree}
            className="select-none fill-primary font-data"
            aria-hidden="true"
          >
            {item.degreeText}
          </text>
        )}
      </>
    );
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
          const isSelected =
            interaction?.selection.kind === "planet" &&
            interaction.selection.key === item.key;
          const isRelated = Boolean(
            interaction?.emphasis.planets.has(item.key),
          );
          const isDimmed =
            Boolean(interaction?.emphasis.active) && !isSelected && !isRelated;

          return (
            <line
              key={`leader-${item.id}`}
              data-part="leader"
              data-planet={item.id}
              x1={item.leader.x1}
              y1={item.leader.y1}
              x2={item.leader.x2}
              y2={item.leader.y2}
              className={cn(
                "stroke-subtle transition-opacity",
                isDimmed && "opacity-40",
              )}
              strokeWidth={1}
            />
          );
        })}

        {/* True position marker ticks (always anchored at r: 175 -> 168) */}
        {model.planets.map((item) => {
          const isSelected =
            interaction?.selection.kind === "planet" &&
            interaction.selection.key === item.key;
          const isRelated = Boolean(
            interaction?.emphasis.planets.has(item.key),
          );
          const isDimmed =
            Boolean(interaction?.emphasis.active) && !isSelected && !isRelated;

          return (
            <line
              key={`marker-${item.id}`}
              data-part="marker"
              data-planet={item.id}
              x1={item.markerInner.x}
              y1={item.markerInner.y}
              x2={item.markerOuter.x}
              y2={item.markerOuter.y}
              className={cn(
                "stroke-strong transition-opacity",
                isDimmed && "opacity-40",
              )}
              strokeWidth={1.5}
            />
          );
        })}
      </g>

      {/* Accessible planet label groups */}
      <g data-part="labels">
        {model.planets.map((item) => {
          if (!interaction) {
            return (
              <g
                key={item.id}
                data-planet={item.id}
                role="img"
                aria-label={item.ariaLabel}
              >
                {renderPlanetContent(item)}
              </g>
            );
          }

          const isSelected =
            interaction.selection.kind === "planet" &&
            interaction.selection.key === item.key;
          const isRelated = interaction.emphasis.planets.has(item.key);
          const isDimmed =
            interaction.emphasis.active && !isSelected && !isRelated;

          return (
            <g
              key={item.id}
              data-planet={item.id}
              role="button"
              tabIndex={0}
              aria-label={`Chọn ${item.ariaLabel}`}
              aria-pressed={isSelected}
              onClick={() =>
                interaction.onSelect({ kind: "planet", key: item.key })
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  if (e.key === " ") {
                    e.preventDefault();
                  }
                  interaction.onSelect({ kind: "planet", key: item.key });
                }
              }}
              onPointerEnter={(e) => {
                if (e.pointerType === "mouse") {
                  interaction.onPreview(
                    { kind: "planet", key: item.key },
                    "hover",
                    "enter",
                  );
                }
              }}
              onPointerLeave={(e) => {
                if (e.pointerType === "mouse") {
                  interaction.onPreview(
                    { kind: "planet", key: item.key },
                    "hover",
                    "leave",
                  );
                }
              }}
              onFocus={() =>
                interaction.onPreview(
                  { kind: "planet", key: item.key },
                  "focus",
                  "enter",
                )
              }
              onBlur={() =>
                interaction.onPreview(
                  { kind: "planet", key: item.key },
                  "focus",
                  "leave",
                )
              }
              className={cn(
                "group cursor-pointer outline-none transition-opacity focus:outline-none",
                isDimmed && "opacity-40",
              )}
            >
              {/* Hit target >= 36x36 for touch target (WCAG 2.5.8) */}
              <rect
                x={item.center.x - 18}
                y={item.center.y - 18}
                width={36}
                height={36}
                fill="transparent"
                aria-hidden="true"
              />

              {/* Selected halo ring */}
              {isSelected && (
                <circle
                  cx={item.center.x}
                  cy={item.center.y}
                  r={18}
                  fill="none"
                  strokeWidth={2}
                  className="stroke-accent-primary"
                  aria-hidden="true"
                />
              )}

              {/* Related halo ring */}
              {isRelated && !isSelected && (
                <circle
                  cx={item.center.x}
                  cy={item.center.y}
                  r={17}
                  fill="none"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  className="stroke-accent-secondary"
                  aria-hidden="true"
                />
              )}

              {/* High-visibility keyboard focus indicator */}
              <rect
                x={item.center.x - 20}
                y={item.center.y - 20}
                width={40}
                height={40}
                rx={4}
                fill="none"
                strokeWidth={2}
                className="stroke-focus opacity-0 group-focus-visible:opacity-100"
                aria-hidden="true"
              />

              {renderPlanetContent(item)}
            </g>
          );
        })}
      </g>
    </g>
  );
}
