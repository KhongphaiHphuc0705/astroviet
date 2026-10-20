import { useId } from "react";

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

  if (selection.kind === "planet") {
    const planet = vm.planets.find((p) => p.key === selection.key);
    if (!planet) {
      return (
        <section
          aria-labelledby={headingId}
          className={cn(
            "bg-surface-raised/40 flex min-h-[5rem] items-center justify-center rounded-lg border border-subtle p-4 text-center",
            className,
          )}
        >
          <h2 id={headingId} className="sr-only">
            Chi tiết đang chọn
          </h2>
          <p className="text-body-sm italic text-subtle">
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
        aria-labelledby={headingId}
        className={cn(
          "bg-surface-raised/40 space-y-3 rounded-lg border border-subtle p-4",
          className,
        )}
      >
        <h2 id={headingId} className="sr-only">
          Chi tiết đang chọn
        </h2>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="text-body-base font-semibold text-primary">
              <PlanetGlyph
                planet={planetLabel}
                retrograde={planet.isRetrograde}
              />
            </div>
            {planet.isRetrograde && (
              <Badge variant="warning" size="sm">
                {RETROGRADE_LABEL_VI}
              </Badge>
            )}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClear}
            aria-label="Bỏ chọn"
          >
            Bỏ chọn
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-secondary">
          <div className="inline-flex items-center gap-1.5">
            <span className="text-subtle">Cung:</span>
            <SignGlyph sign={planet.sign} />
          </div>

          {planet.degreeLabel && (
            <div className="inline-flex items-center gap-1.5">
              <span className="text-subtle">Tọa độ:</span>
              <span className="font-mono font-medium text-primary">
                {planet.degreeLabel}
              </span>
            </div>
          )}

          {planet.houseNumber !== null && (
            <div className="inline-flex items-center gap-1.5">
              <span className="text-subtle">Vị trí:</span>
              <span className="font-medium text-primary">
                Nhà {planet.houseNumber}
              </span>
            </div>
          )}

          <div className="text-body-xs inline-flex items-center gap-1.5 text-subtle">
            {relatedAspectsCount > 0 ? (
              <span>Có {relatedAspectsCount} góc chiếu liên quan</span>
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
          aria-labelledby={headingId}
          className={cn(
            "bg-surface-raised/40 flex min-h-[5rem] items-center justify-center rounded-lg border border-subtle p-4 text-center",
            className,
          )}
        >
          <h2 id={headingId} className="sr-only">
            Chi tiết đang chọn
          </h2>
          <p className="text-body-sm italic text-subtle">
            Chọn một hành tinh hoặc góc chiếu để xem chi tiết.
          </p>
        </section>
      );
    }

    return (
      <section
        aria-labelledby={headingId}
        className={cn(
          "bg-surface-raised/40 space-y-3 rounded-lg border border-subtle p-4",
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
            onClick={onClear}
            aria-label="Bỏ chọn"
          >
            Bỏ chọn
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-body-sm text-secondary">
          <div className="inline-flex items-center gap-1.5">
            <span className="text-subtle">Tính chất:</span>
            <span className="font-medium text-primary">
              {aspect.nature.labelVi}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <span className="text-subtle">Sai số:</span>
            <span className="font-mono font-medium text-primary">
              {aspect.orbLabel ?? `${aspect.orb.toFixed(1)}°`}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5">
            <span className="text-subtle">Trạng thái:</span>
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
      aria-labelledby={headingId}
      className={cn(
        "bg-surface-raised/40 flex min-h-[5rem] items-center justify-center rounded-lg border border-subtle p-4 text-center",
        className,
      )}
    >
      <h2 id={headingId} className="sr-only">
        Chi tiết đang chọn
      </h2>
      <p className="text-body-sm italic text-subtle">
        Chọn một hành tinh hoặc góc chiếu để xem chi tiết.
      </p>
    </section>
  );
}
