import { useId, useMemo } from "react";

import type { ChartViewModel } from "../../model/chartViewModel";
import {
  buildPlanetWheelModel,
  type PlanetWheelModel,
} from "../../model/planetGeometry";
import {
  buildWheelGeometry,
  type WheelGeometry,
} from "../../model/wheelGeometry";

import { AngleLayer } from "./AngleLayer";
import { HouseLayer } from "./HouseLayer";
import { PlanetLayer } from "./PlanetLayer";
import { TickLayer } from "./TickLayer";
import { ZodiacLayer } from "./ZodiacLayer";

export interface ChartWheelProps {
  vm: ChartViewModel;
  geometry?: WheelGeometry;
  planetModel?: PlanetWheelModel;
  className?: string;
}

/**
 * Builds a concise accessible description for the chart wheel SVG.
 * Notes house system availability, Ascendant location, and number of displayed planets.
 */
export function buildWheelDescription(
  vm: ChartViewModel,
  planetModel?: PlanetWheelModel,
): string {
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

  if (vm.planets.length === 0) {
    parts.push("Không có hành tinh nào được hiển thị.");
  } else if (planetModel?.status === "overflow") {
    parts.push(
      "Vị trí hành tinh hiển thị bằng vạch dấu; chi tiết xem tại bảng bên dưới.",
    );
  } else {
    parts.push(`Hiển thị ${vm.planets.length} hành tinh.`);
  }

  return parts.join(" ");
}

/**
 * ChartWheel: SVG visualization of the astrological chart wheel foundation.
 * Renders the 12 zodiac signs, degree tick marks, house cusps, cardinal angle axes, and planet bodies.
 * Wrapped in semantic <figure> with scrollable focusable region and descriptive <figcaption>.
 */
export function ChartWheel({
  vm,
  geometry,
  planetModel: planetModelProp,
  className,
}: ChartWheelProps) {
  const titleId = useId();
  const descId = useId();

  const wheelGeometry = useMemo(
    () => geometry ?? buildWheelGeometry(vm),
    [geometry, vm],
  );

  const planetModel = useMemo(
    () =>
      planetModelProp ??
      buildPlanetWheelModel(vm.planets, wheelGeometry.rotation, {
        hasHouses: wheelGeometry.hasHouses,
      }),
    [
      planetModelProp,
      vm.planets,
      wheelGeometry.rotation,
      wheelGeometry.hasHouses,
    ],
  );

  const description = useMemo(
    () => buildWheelDescription(vm, planetModel),
    [vm, planetModel],
  );

  const figcaptionText = useMemo(() => {
    if (planetModel.status === "overflow") {
      return "Do các hành tinh tập trung quá dày, nhãn chữ không hiển thị trên vòng tròn. Vui lòng xem bảng dữ liệu chi tiết bên dưới.";
    }
    if (planetModel.tier === "B") {
      return "Hiển thị vòng 12 cung, nhà, các góc và vị trí hành tinh. Độ của từng hành tinh xem ở bảng bên dưới.";
    }
    return "Hiển thị vòng 12 cung, nhà, các góc và vị trí hành tinh.";
  }, [planetModel.status, planetModel.tier]);

  return (
    <figure data-testid="chart-wheel" className={className}>
      <div
        role="region"
        aria-label="Biểu đồ tròn, có thể cuộn ngang trên màn hình hẹp"
        tabIndex={0}
        className="overflow-x-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <svg
          viewBox="0 0 600 600"
          role="group"
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
          <PlanetLayer model={planetModel} />
        </svg>
      </div>
      <figcaption className="mt-3 text-center text-body-sm text-secondary">
        {figcaptionText}
      </figcaption>
    </figure>
  );
}
