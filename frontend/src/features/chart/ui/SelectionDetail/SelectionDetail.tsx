import { useCallback, useId, useRef } from "react";

import { cn } from "@shared/lib/cn";
import { Badge } from "@shared/ui/Badge";
import { Button } from "@shared/ui/Button";

import type { ChartViewModel } from "../../model/chartViewModel";
import { RETROGRADE_LABEL_VI } from "../../model/labels";
import type { Selection } from "../../model/selection";
import { AspectBadge, PlanetGlyph, SignGlyph } from "../ChartBadges";

export interface SelectionDetailProps {
  selection: Selection;
  vm: ChartViewModel;
  onClear: () => void;
  className?: string;
}

export function SelectionDetail({
  selection,
  vm,
  onClear,
  className,
}: SelectionDetailProps) {
  const headingId = useId();
  const sectionRef = useRef<HTMLElement>(null);

  const handleClear = useCallback(() => {
    onClear();
    sectionRef.current?.focus();
  }, [onClear]);

  if (selection.kind === "planet") {
    const planet = vm.planets.find((p) => p.key === selection.key);
    if (!planet) {
      return (
        <section
          ref={sectionRef}
          tabIndex={-1}
          aria-labelledby={headingId}
          className={cn(
            "bg-surface-raised/40 flex min-h-[4rem] items-center justify-center rounded-lg border border-subtle px-4 py-3 text-center outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
            className,
          )}
        >
          <h2 id={headingId} className="sr-only">
            Chi tiết đang chọn
          </h2>
          <p className="text-body-sm italic text-secondary">
            Chọn một hành tinh hoặc góc chiếu để xem chi tiết.
          </p>
        </section>
      );
    }

    const planetLabel = {
      key: planet.key,
      labelVi: planet.nameVi,
      glyph: planet.glyph,
      known: planet.known,
    };

    const relatedAspectsCount = vm.aspects.filter(
      (a) => a.planetA.key === planet.key || a.planetB.key === planet.key,
    ).length;

    return (
      <section
        ref={sectionRef}
        tabIndex={-1}
        aria-labelledby={headingId}
        className={cn(
          "bg-surface-raised/40 space-y-2.5 rounded-lg border border-subtle px-4 pb-3 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
          className,
        )}
      >
        <h2 id={headingId} className="sr-only">
          Chi tiết đang chọn
        </h2>
        <div className="flex items-center justify-between gap-3">
          <div className="-mt-2 flex items-center gap-2">
            <div className="text-body-base font-semibold text-primary">
              <PlanetGlyph
                planet={planetLabel}
                retrograde={planet.isRetrograde}
              />
            </div>
            {planet.isRetrograde && (
              <Badge variant="warning" size="sm" className="w-28 h-6">
                {RETROGRADE_LABEL_VI}
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClear}
            aria-label="Bỏ chọn"
          >
            Bỏ chọn
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-secondary">
          <div className="inline-flex items-center gap-1.5">
            <span className="font-medium text-secondary">Cung:</span>
            <span className="font-medium text-primary">
              <SignGlyph sign={planet.sign} />
            </span>
          </div>

          {planet.degreeLabel && (
            <div className="inline-flex items-center gap-1.5">
              <span className="font-medium text-secondary">Độ:</span>
              <span className="font-data font-medium text-primary">
                {planet.degreeLabel}
              </span>
            </div>
          )}

          {planet.houseNumber !== null && (
            <div className="inline-flex items-center gap-1.5">
              <span className="font-medium text-secondary">Nhà:</span>
              <span className="font-medium text-primary">
                Nhà {planet.houseNumber}
              </span>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 text-body-sm text-secondary">
            {relatedAspectsCount > 0 ? (
              <span>
                Có{" "}
                <span className="font-semibold text-primary">
                  {relatedAspectsCount}
                </span>{" "}
                góc chiếu liên quan
              </span>
            ) : (
              <span>Không có góc chiếu liên quan</span>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (selection.kind === "aspect") {
    const aspect = vm.aspects.find((a) => a.key === selection.key);
    if (!aspect) {
      return (
        <section
          ref={sectionRef}
          tabIndex={-1}
          aria-labelledby={headingId}
          className={cn(
            "bg-surface-raised/40 flex min-h-[4rem] items-center justify-center rounded-lg border border-subtle px-4 py-3 text-center outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
            className,
          )}
        >
          <h2 id={headingId} className="sr-only">
            Chi tiết đang chọn
          </h2>
          <p className="text-body-sm italic text-secondary">
            Chọn một hành tinh hoặc góc chiếu để xem chi tiết.
          </p>
        </section>
      );
    }

    return (
      <section
        ref={sectionRef}
        tabIndex={-1}
        aria-labelledby={headingId}
        className={cn(
          "bg-surface-raised/40 space-y-2.5 rounded-lg border border-subtle px-4 pb-3 outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
          className,
        )}
      >
        <h2 id={headingId} className="sr-only">
          Chi tiết đang chọn
        </h2>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-body-base inline-flex items-center gap-2 font-semibold text-primary">
              <AspectBadge type={aspect.type} nature={aspect.nature} />
              <span>
                {aspect.planetA.labelVi} – {aspect.planetB.labelVi}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleClear}
            aria-label="Bỏ chọn"
          >
            Bỏ chọn
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-secondary">
          <div className="inline-flex items-center gap-1.5">
            <span className="font-medium text-secondary">Tính chất:</span>
            <span className="font-medium text-primary">
              {aspect.nature.labelVi}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <span className="font-medium text-secondary">Orb:</span>
            <span className="font-data font-medium text-primary">
              {aspect.orbLabel ?? `${aspect.orb.toFixed(1)}°`}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <span className="font-medium text-secondary">Trạng thái:</span>
            <span className="font-medium text-primary">
              {aspect.applyingLabelVi}
            </span>
          </div>
        </div>
      </section>
    );
  }

  // selection.kind === "none"
  return (
    <section
      ref={sectionRef}
      tabIndex={-1}
      aria-labelledby={headingId}
      className={cn(
        "bg-surface-raised/40 flex min-h-[4rem] items-center justify-center rounded-lg border border-subtle px-4 py-3 text-center outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        className,
      )}
    >
      <h2 id={headingId} className="sr-only">
        Chi tiết đang chọn
      </h2>
      <p className="text-body-sm italic text-secondary">
        Chọn một hành tinh hoặc góc chiếu để xem chi tiết.
      </p>
    </section>
  );
}
