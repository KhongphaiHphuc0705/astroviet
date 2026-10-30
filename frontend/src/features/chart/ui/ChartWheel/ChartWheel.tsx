import { useId, useLayoutEffect, useMemo, useRef } from "react";

import {
  buildAspectGeometry,
  type AspectGeometryResult,
} from "../../model/aspectGeometry";
import type { ChartViewModel } from "../../model/chartViewModel";
import {
  buildPlanetWheelModel,
  type PlanetWheelModel,
} from "../../model/planetGeometry";
import type { WheelInteraction } from "../../model/selection";
import {
  buildWheelGeometry,
  type WheelGeometry,
} from "../../model/wheelGeometry";

import { AngleLayer } from "./AngleLayer";
import { AspectLayer } from "./AspectLayer";
import { HouseLayer } from "./HouseLayer";
import { PlanetLayer } from "./PlanetLayer";
import { TickLayer } from "./TickLayer";
import { ZodiacLayer } from "./ZodiacLayer";

export interface ChartWheelProps {
  vm: ChartViewModel;
  geometry?: WheelGeometry;
  planetModel?: PlanetWheelModel;
  aspectGeometry?: AspectGeometryResult;
  showAspectLines?: boolean;
  interaction?: WheelInteraction;
  zoom?: number;
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
  aspectGeometry: aspectGeometryProp,
  showAspectLines = false,
  interaction,
  zoom = 1,
  className,
}: ChartWheelProps) {
  const titleId = useId();
  const descId = useId();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const centerScroll = () => {
      const maxScrollLeft = el.scrollWidth - el.clientWidth;
      const maxScrollTop = el.scrollHeight - el.clientHeight;

      if (maxScrollLeft > 0) {
        el.scrollLeft = Math.round(maxScrollLeft / 2);
      }
      if (maxScrollTop > 0) {
        el.scrollTop = Math.round(maxScrollTop / 2);
      }
    };

    centerScroll();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        centerScroll();
      });
      resizeObserver.observe(el);
    }

    window.addEventListener("resize", centerScroll);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener("resize", centerScroll);
    };
  }, [zoom]);

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

  const resolvedAspectGeometry = useMemo(
    () =>
      aspectGeometryProp ??
      buildAspectGeometry(vm.aspects, vm.planets, wheelGeometry.rotation),
    [aspectGeometryProp, vm.aspects, vm.planets, wheelGeometry.rotation],
  );

  const description = useMemo(
    () => buildWheelDescription(vm, planetModel),
    [vm, planetModel],
  );

  const figcaptionText = useMemo(() => {
    const hasAspects =
      showAspectLines && resolvedAspectGeometry.lines.length > 0;

    if (planetModel.status === "overflow") {
      const base =
        "Do các hành tinh tập trung quá dày, nhãn chữ không hiển thị trên vòng tròn. Vui lòng xem bảng dữ liệu chi tiết bên dưới.";
      return hasAspects
        ? `${base} Các đường nối thể hiện góc chiếu giữa các hành tinh. Kiểu nét giúp phân biệt nhóm góc chiếu; xem chú giải để biết ý nghĩa từng kiểu.`
        : base;
    }

    if (planetModel.tier === "B") {
      const base = hasAspects
        ? "Hiển thị vòng 12 cung, nhà, các góc, vị trí hành tinh và các đường góc chiếu. Độ của từng hành tinh xem ở bảng bên dưới."
        : "Hiển thị vòng 12 cung, nhà, các góc và vị trí hành tinh. Độ của từng hành tinh xem ở bảng bên dưới.";
      return hasAspects
        ? `${base} Các đường nối thể hiện góc chiếu giữa các hành tinh. Kiểu nét giúp phân biệt nhóm góc chiếu; xem chú giải để biết ý nghĩa từng kiểu.`
        : base;
    }

    if (hasAspects) {
      return "Hiển thị vòng 12 cung, nhà, các góc, vị trí hành tinh và các đường góc chiếu. Các đường nối thể hiện góc chiếu giữa các hành tinh. Kiểu nét giúp phân biệt nhóm góc chiếu; xem chú giải để biết ý nghĩa từng kiểu.";
    }

    return "Hiển thị vòng 12 cung, nhà, các góc và vị trí hành tinh.";
  }, [
    planetModel.status,
    planetModel.tier,
    showAspectLines,
    resolvedAspectGeometry.lines.length,
  ]);

  return (
    <figure data-testid="chart-wheel" className={className}>
      <div
        ref={scrollContainerRef}
        role="region"
        aria-label="Khung biểu đồ, có thể cuộn khi phóng to hoặc màn hình hẹp"
        tabIndex={0}
        style={{ "--zoom": zoom } as React.CSSProperties}
        className="mx-auto w-full max-w-[640px] touch-pan-x touch-pan-y touch-pinch-zoom overflow-auto rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus max-md:aspect-square"
      >
        <svg
          viewBox="0 0 600 600"
          role="group"
          aria-labelledby={titleId}
          aria-describedby={descId}
          className="mx-auto h-auto max-md:w-[max(400px,calc(var(--zoom)*100%))] max-md:max-w-none md:w-full md:min-w-[400px] md:max-w-[640px]"
        >
          <title id={titleId}>Biểu đồ Natal</title>
          <desc id={descId}>{description}</desc>

          <ZodiacLayer signs={wheelGeometry.signs} />
          <TickLayer ticks={wheelGeometry.ticks} />
          <HouseLayer houses={wheelGeometry.houses} />
          <AngleLayer angles={wheelGeometry.angles} />
          {showAspectLines && (
            <AspectLayer
              geometry={resolvedAspectGeometry}
              interaction={interaction}
            />
          )}
          <PlanetLayer model={planetModel} interaction={interaction} />
        </svg>
      </div>
      <figcaption className="mt-3 text-center text-body-sm text-secondary">
        {figcaptionText}
      </figcaption>
    </figure>
  );
}
