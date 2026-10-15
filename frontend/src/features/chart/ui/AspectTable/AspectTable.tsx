import { useId } from "react";

import { cn } from "@shared/lib/cn";
import { Card } from "@shared/ui/Card";
import { EmptyState } from "@shared/ui/EmptyState";

import type { AspectKey, AspectVM } from "../../model/chartViewModel";
import type { GlyphLabel } from "../../model/labels";
import { AspectBadge, PlanetGlyph } from "../ChartBadges";
import {
  getTableCellPadding,
  TABLE_NUMERIC_FONT,
  type TableDensity,
} from "../tableStyles";

import { AspectFilterChip } from "./AspectFilterChip";

export interface AspectTableProps {
  aspects: AspectVM[];
  layout?: "table" | "cards";
  density?: TableDensity;
  selectedKey?: string | null;
  onSelect?: (key: AspectKey) => void;
  filterPlanetKey?: string | null;
  filterPlanet?: GlyphLabel;
  onClearFilter?: () => void;
  className?: string;
}

export function AspectTable({
  aspects,
  layout = "table",
  density = "comfortable",
  selectedKey,
  onSelect,
  filterPlanetKey,
  filterPlanet,
  onClearFilter,
  className,
}: AspectTableProps) {
  const headingId = useId();
  const cellPadding = getTableCellPadding(density);

  const resolvedFilterPlanet: GlyphLabel | undefined = filterPlanetKey
    ? (filterPlanet ?? {
        key: filterPlanetKey,
        labelVi: filterPlanetKey,
        glyph: null,
        known: false,
      })
    : undefined;

  const displayedAspects = filterPlanetKey
    ? aspects.filter(
        (a) =>
          a.planetA.key === filterPlanetKey ||
          a.planetB.key === filterPlanetKey,
      )
    : aspects;

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2
        id={headingId}
        className="mb-3 text-heading-sm font-semibold text-primary"
      >
        Góc chiếu
      </h2>

      <div aria-live="polite" className="min-h-[2rem]">
        {filterPlanetKey && resolvedFilterPlanet && (
          <div className="mb-3">
            <AspectFilterChip
              planet={resolvedFilterPlanet}
              onClear={onClearFilter}
            />
          </div>
        )}
      </div>

      {aspects.length === 0 ? (
        <EmptyState title="Không tìm thấy góc chiếu nào trong phạm vi orb hiện tại" />
      ) : displayedAspects.length === 0 ? (
        <p className="py-6 text-center text-body-sm italic text-subtle">
          Không có góc chiếu nào của {resolvedFilterPlanet?.labelVi} trong dữ
          liệu
        </p>
      ) : layout === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-body-sm text-primary">
            <caption className="sr-only">
              Góc chiếu giữa các hành tinh — Natal Chart,{" "}
              {displayedAspects.length} hàng, sắp theo orb tăng dần
            </caption>
            <thead>
              <tr className="text-body-xs border-b border-subtle font-medium uppercase text-subtle">
                <th scope="col" className={cn(cellPadding, "text-left")}>
                  Hành tinh A
                </th>
                <th scope="col" className={cn(cellPadding, "text-left")}>
                  Góc chiếu
                </th>
                <th scope="col" className={cn(cellPadding, "text-left")}>
                  Hành tinh B
                </th>
                <th scope="col" className={cn(cellPadding, "text-left")}>
                  Orb
                </th>
                <th scope="col" className={cn(cellPadding, "text-left")}>
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedAspects.map((aspect, index) => {
                const isSelected = selectedKey === aspect.key;
                const buttonLabel = `Chọn góc chiếu ${aspect.type.labelVi} giữa ${aspect.planetA.labelVi} và ${aspect.planetB.labelVi}`;

                return (
                  <tr
                    key={`${aspect.key}#${index}`}
                    className={cn(
                      "border-b border-subtle transition-colors",
                      isSelected
                        ? "bg-surface-raised font-semibold"
                        : "hover:bg-surface-hover/50",
                    )}
                  >
                    <th
                      scope="row"
                      className={cn(cellPadding, "font-medium text-primary")}
                    >
                      {onSelect ? (
                        <button
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => onSelect(aspect.key)}
                          aria-label={buttonLabel}
                          className={cn(
                            "rounded inline-flex items-center text-left transition-colors",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                            isSelected && "font-semibold",
                          )}
                        >
                          <PlanetGlyph planet={aspect.planetA} />
                        </button>
                      ) : (
                        <PlanetGlyph planet={aspect.planetA} />
                      )}
                    </th>
                    <td className={cellPadding}>
                      <AspectBadge type={aspect.type} nature={aspect.nature} />
                    </td>
                    <td className={cellPadding}>
                      <PlanetGlyph planet={aspect.planetB} />
                    </td>
                    <td className={cn(cellPadding, TABLE_NUMERIC_FONT)}>
                      {aspect.orbLabel ?? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Không có dữ liệu</span>
                        </>
                      )}
                    </td>
                    <td className={cellPadding}>
                      <span className="text-secondary">
                        {aspect.applyingLabelVi}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <ul
          role="list"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {displayedAspects.map((aspect, index) => {
            const isSelected = selectedKey === aspect.key;
            const buttonLabel = `Chọn góc chiếu ${aspect.type.labelVi} giữa ${aspect.planetA.labelVi} và ${aspect.planetB.labelVi}`;

            return (
              <Card
                as="li"
                key={`${aspect.key}#${index}`}
                padding="sm"
                className={cn(
                  "flex flex-col gap-3 transition-colors",
                  isSelected && "bg-surface-raised ring-2 ring-accent-primary",
                )}
              >
                <div>
                  {onSelect ? (
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelect(aspect.key)}
                      aria-label={buttonLabel}
                      className={cn(
                        "rounded inline-flex min-h-[44px] w-full min-w-[44px] items-center text-left transition-colors",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                        isSelected && "font-semibold",
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <PlanetGlyph planet={aspect.planetA} size="md" />
                        <AspectBadge
                          type={aspect.type}
                          nature={aspect.nature}
                          size="md"
                        />
                        <PlanetGlyph planet={aspect.planetB} size="md" />
                      </div>
                    </button>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <PlanetGlyph planet={aspect.planetA} size="md" />
                      <AspectBadge
                        type={aspect.type}
                        nature={aspect.nature}
                        size="md"
                      />
                      <PlanetGlyph planet={aspect.planetB} size="md" />
                    </div>
                  )}
                </div>

                <dl className="grid grid-cols-2 gap-2 text-body-sm">
                  <div>
                    <dt className="text-body-xs text-subtle">Orb</dt>
                    <dd
                      className={cn(
                        "mt-0.5 font-medium text-primary",
                        TABLE_NUMERIC_FONT,
                      )}
                    >
                      {aspect.orbLabel ?? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Không có dữ liệu</span>
                        </>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-body-xs text-subtle">Trạng thái</dt>
                    <dd className="mt-0.5 font-medium text-secondary">
                      {aspect.applyingLabelVi}
                    </dd>
                  </div>
                </dl>
              </Card>
            );
          })}
        </ul>
      )}
    </section>
  );
}
