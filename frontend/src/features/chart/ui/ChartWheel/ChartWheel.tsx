import { useId, useMemo } from "react";

import type { ChartViewModel } from "../../model/chartViewModel";
import {
  buildWheelGeometry,
  type WheelGeometry,
} from "../../model/wheelGeometry";

import { AngleLayer } from "./AngleLayer";
import { HouseLayer } from "./HouseLayer";
import { TickLayer } from "./TickLayer";
import { ZodiacLayer } from "./ZodiacLayer";

export interface ChartWheelProps {
  vm: ChartViewModel;
  geometry?: WheelGeometry;
  className?: string;
}

/**
 * Builds a concise accessible description for the chart wheel SVG.
 * Notes house system availability and Ascendant location when present.
 * Does not mention celestial bodies as they are not rendered in M4.
 */
export function buildWheelDescription(vm: ChartViewModel): string {
  const parts: string[] = ["Biểu đồ lá số chiêm tinh."];

  if (vm.flags.houseDataAvailable) {
    parts.push(`Hệ nhà ${vm.meta.houseSystem.labelVi}.`);
  } else {
    parts.push("Không có dữ liệu nhà.");
  }

  const asc = vm.angles.find((a) => a.key === "Ascendant");
  if (asc && asc.sign && asc.degreeLabel) {
    parts.push(`Cung Mọc tại ${asc.sign.labelVi} ${asc.degreeLabel}.`);
  }

  return parts.join(" ");
}

/**
 * ChartWheel: SVG visualization of the astrological chart wheel foundation.
 * Renders the 12 zodiac signs, degree tick marks, house cusps, and cardinal angle axes.
 * Wrapped in semantic <figure> with scrollable focusable region and descriptive <figcaption>.
 */
export function ChartWheel({ vm, geometry, className }: ChartWheelProps) {
  const titleId = useId();
  const descId = useId();

  const wheelGeometry = useMemo(
    () => geometry ?? buildWheelGeometry(vm),
    [geometry, vm],
  );

  const description = useMemo(() => buildWheelDescription(vm), [vm]);

  return (
    <figure data-testid="chart-wheel" className={className}>
      <div
        ref={(el) => {
          if (el) el.tabIndex = 0;
        }}
        role="region"
        aria-label="Biểu đồ tròn, có thể cuộn ngang trên màn hình hẹp"
        className="overflow-x-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <svg
          viewBox="0 0 600 600"
          role="img"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="mx-auto h-auto w-full min-w-[400px] max-w-[640px]"
        >
          <title id={titleId}>Biểu đồ Natal</title>
          <desc id={descId}>{description}</desc>

          <ZodiacLayer signs={wheelGeometry.signs} />
          <TickLayer ticks={wheelGeometry.ticks} />
          <HouseLayer houses={wheelGeometry.houses} />
          <AngleLayer angles={wheelGeometry.angles} />
        </svg>
      </div>
      <figcaption className="mt-3 text-center text-body-sm text-secondary">
        Hiển thị vòng 12 cung, nhà và các góc. Vị trí hành tinh xem ở các bảng
        bên dưới.
      </figcaption>
    </figure>
  );
}
