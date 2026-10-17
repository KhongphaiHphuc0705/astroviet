import type { WheelTick } from "../../model/wheelGeometry";

export interface TickLayerProps {
  ticks: WheelTick[];
}

/**
 * Renders the degree divisions (ticks) layer:
 * - 72 radial tick marks around the wheel (every 5 degrees)
 * - 12 major ticks at 30-degree boundaries (longer, stroke-strong, 1.5px)
 * - 60 minor ticks (shorter, stroke-subtle, 1px)
 */
export function TickLayer({ ticks }: TickLayerProps) {
  return (
    <g data-layer="degree-ticks" aria-hidden="true">
      {ticks.map((tick, index) => {
        const isMajor = tick.kind === "major";
        return (
          <line
            key={index}
            x1={tick.x1}
            y1={tick.y1}
            x2={tick.x2}
            y2={tick.y2}
            className={isMajor ? "stroke-strong" : "stroke-subtle"}
            strokeWidth={isMajor ? 1.5 : 1}
            data-kind={tick.kind}
          />
        );
      })}
    </g>
  );
}
