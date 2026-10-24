import { cn } from "@shared/lib/cn";

import type { AspectGeometryResult } from "../../model/aspectGeometry";
import { WHEEL_CENTER } from "../../model/geometry";
import type { WheelInteraction } from "../../model/selection";

import { TONE_FILL_CLASSES, TONE_STROKE_CLASSES } from "./aspectStyles";

export interface AspectLayerProps {
  geometry: AspectGeometryResult;
  center?: number;
  interaction?: WheelInteraction;
}

/**
 * AspectLayer: SVG rendering of astrological aspect lines and Conjunction arcs/dots.
 * Rendered within ChartWheel underneath the planet bodies.
 * - Static mode (!interaction): aria-hidden="true", pointer-events-none (M6 preservation).
 * - Interactive mode (interaction): pointer-only interaction (tap on touch device selects),
 *   aria-hidden="true" preserved (keyboard access provided by AspectTable per D-M8-08),
 *   wide transparent hit target paths (~14px), selected/related emphasis and dimming (M8 Task 3).
 */
export function AspectLayer({
  geometry,
  center = WHEEL_CENTER,
  interaction,
}: AspectLayerProps) {
  if (geometry.lines.length === 0) {
    return null;
  }

  return (
    <g
      data-layer="aspects"
      aria-hidden="true"
      className={cn(!interaction && "pointer-events-none")}
    >
      {/* Reference anchor ring at aspectRing radius */}
      <circle
        data-part="aspect-ring"
        cx={center}
        cy={center}
        r={geometry.ringRadius}
        fill="none"
        className="pointer-events-none stroke-subtle"
        strokeWidth={1}
      />

      {/* Visual aspect lines */}
      {geometry.lines.map((l) => {
        const isSelected =
          interaction?.selection.kind === "aspect" &&
          interaction.selection.key === l.key;
        const isRelated = Boolean(interaction?.emphasis.aspects.has(l.key));
        const isDimmed =
          Boolean(interaction?.emphasis.active) && !isSelected && !isRelated;

        const strokeWidth = isSelected ? l.style.width + 1.5 : l.style.width;

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
              r={strokeWidth / 2}
              className={cn(
                TONE_FILL_CLASSES[l.natureTone],
                "pointer-events-none transition-opacity motion-reduce:transition-none",
                isDimmed && "opacity-25",
              )}
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
            className={cn(
              TONE_STROKE_CLASSES[l.natureTone],
              "pointer-events-none transition-opacity motion-reduce:transition-none",
              isDimmed && "opacity-25",
            )}
            strokeWidth={strokeWidth}
            strokeDasharray={l.style.dasharray ?? undefined}
            strokeLinecap={l.style.linecap}
          />
        );
      })}

      {/* Interactive hit targets for pointer / touch interaction (D-M8-08) */}
      {interaction && (
        <g data-part="aspect-hit-targets" aria-hidden="true">
          {geometry.lines.map((l) => {
            if (l.shape === "dot") {
              return (
                <circle
                  key={`hit-${l.key}`}
                  cx={l.start.x}
                  cy={l.start.y}
                  r={14}
                  fill="transparent"
                  className="cursor-pointer"
                  onClick={() =>
                    interaction.onSelect({ kind: "aspect", key: l.key })
                  }
                  onPointerEnter={(e) => {
                    if (e.pointerType === "mouse") {
                      interaction.onPreview(
                        { kind: "aspect", key: l.key },
                        "hover",
                        "enter",
                      );
                    }
                  }}
                  onPointerLeave={(e) => {
                    if (e.pointerType === "mouse") {
                      interaction.onPreview(
                        { kind: "aspect", key: l.key },
                        "hover",
                        "leave",
                      );
                    }
                  }}
                />
              );
            }

            return (
              <path
                key={`hit-${l.key}`}
                d={l.d ?? undefined}
                fill="none"
                stroke="transparent"
                strokeWidth={14}
                strokeLinecap="round"
                className="cursor-pointer"
                onClick={() =>
                  interaction.onSelect({ kind: "aspect", key: l.key })
                }
                onPointerEnter={(e) => {
                  if (e.pointerType === "mouse") {
                    interaction.onPreview(
                      { kind: "aspect", key: l.key },
                      "hover",
                      "enter",
                    );
                  }
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse") {
                    interaction.onPreview(
                      { kind: "aspect", key: l.key },
                      "hover",
                      "leave",
                    );
                  }
                }}
              />
            );
          })}
        </g>
      )}
    </g>
  );
}
