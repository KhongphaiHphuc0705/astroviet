import { useId } from "react";

import { cn } from "@shared/lib/cn";
import { Card } from "@shared/ui/Card";
import { EmptyState } from "@shared/ui/EmptyState";

import type { PlanetKey, PlanetVM } from "../../model/chartViewModel";
import { RETROGRADE_GLYPH, type GlyphLabel } from "../../model/labels";
import { HouseBadge, PlanetGlyph, SignGlyph } from "../ChartBadges";
import {
  getTableCellPadding,
  TABLE_NUMERIC_FONT,
  type TableDensity,
} from "../tableStyles";

export interface PlanetTableProps {
  planets: PlanetVM[];
  houseDataAvailable: boolean;
  layout?: "table" | "cards";
  density?: TableDensity;
  selectedKey?: string | null;
  onSelect?: (key: PlanetKey) => void;
  relatedKeys?: ReadonlySet<PlanetKey>;
  onPreview?: (
    key: PlanetKey,
    source: "hover" | "focus",
    phase: "enter" | "leave",
  ) => void;
  className?: string;
}

export function PlanetTable({
  planets,
  houseDataAvailable,
  layout = "table",
  density = "comfortable",
  selectedKey,
  onSelect,
  relatedKeys,
  onPreview,
  className,
}: PlanetTableProps) {
  const headingId = useId();
  const cellPadding = getTableCellPadding(density);

  if (planets.length === 0) {
    return (
      <section aria-labelledby={headingId} className={className}>
        <h2
          id={headingId}
          className="mb-3 text-heading-sm font-semibold text-primary"
        >
          Vị trí hành tinh
        </h2>
        <EmptyState title="Không có dữ liệu hành tinh để hiển thị" />
      </section>
    );
  }

  return (
    <section aria-labelledby={headingId} className={className}>
      <h2
        id={headingId}
        className="mb-3 text-heading-sm font-semibold text-primary"
      >
        Vị trí hành tinh
      </h2>

      {layout === "table" ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-body-sm text-primary">
            <caption className="sr-only">
              Vị trí hành tinh — Natal Chart, {planets.length} hàng
            </caption>
            <thead>
              <tr className="text-body-xs border-b border-subtle font-medium uppercase text-subtle">
                <th scope="col" className={cn(cellPadding, "text-left")}>
                  Hành tinh
                </th>
                <th scope="col" className={cn(cellPadding, "text-left")}>
                  Cung
                </th>
                <th scope="col" className={cn(cellPadding, "text-left")}>
                  Độ
                </th>
                {houseDataAvailable && (
                  <th scope="col" className={cn(cellPadding, "text-left")}>
                    Nhà
                  </th>
                )}
                <th scope="col" className={cn(cellPadding, "text-left")}>
                  Nghịch hành
                </th>
              </tr>
            </thead>
            <tbody>
              {planets.map((planet, index) => {
                const isSelected = selectedKey === planet.key;
                const isRelated = Boolean(relatedKeys?.has(planet.key));
                const planetLabel: GlyphLabel = {
                  key: planet.key,
                  labelVi: planet.nameVi,
                  glyph: planet.glyph,
                  known: planet.known,
                };

                return (
                  <tr
                    key={`${planet.key}#${index}`}
                    className={cn(
                      "border-b border-subtle transition-colors motion-reduce:transition-none",
                      isSelected
                        ? "bg-surface-raised font-semibold"
                        : isRelated
                          ? "bg-surface-raised/40 font-medium"
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
                          onClick={() => onSelect(planet.key)}
                          onPointerEnter={(e) => {
                            if (e.pointerType === "mouse") {
                              onPreview?.(planet.key, "hover", "enter");
                            }
                          }}
                          onPointerLeave={(e) => {
                            if (e.pointerType === "mouse") {
                              onPreview?.(planet.key, "hover", "leave");
                            }
                          }}
                          onFocus={() =>
                            onPreview?.(planet.key, "focus", "enter")
                          }
                          onBlur={() =>
                            onPreview?.(planet.key, "focus", "leave")
                          }
                          aria-label={`Chọn ${planet.nameVi}`}
                          className={cn(
                            "rounded inline-flex items-center text-left transition-colors motion-reduce:transition-none",
                            "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                            isSelected && "font-semibold",
                          )}
                        >
                          <PlanetGlyph planet={planetLabel} />
                        </button>
                      ) : (
                        <PlanetGlyph planet={planetLabel} />
                      )}
                    </th>
                    <td className={cellPadding}>
                      <SignGlyph sign={planet.sign} />
                    </td>
                    <td className={cn(cellPadding, TABLE_NUMERIC_FONT)}>
                      {planet.degreeLabel ?? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Không có dữ liệu</span>
                        </>
                      )}
                    </td>
                    {houseDataAvailable && (
                      <td className={cellPadding}>
                        {planet.houseNumber !== null ? (
                          <HouseBadge house={planet.houseNumber} />
                        ) : (
                          <>
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">
                              Không có dữ liệu nhà
                            </span>
                          </>
                        )}
                      </td>
                    )}
                    <td className={cellPadding}>
                      {planet.isRetrograde ? (
                        <span className="inline-flex items-center gap-1 text-accent-primary">
                          <span aria-hidden="true" className="font-display">
                            {RETROGRADE_GLYPH}
                          </span>
                          <span>Nghịch hành</span>
                        </span>
                      ) : (
                        <span>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Không nghịch hành</span>
                        </span>
                      )}
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
          {planets.map((planet, index) => {
            const isSelected = selectedKey === planet.key;
            const isRelated = Boolean(relatedKeys?.has(planet.key));
            const planetLabel: GlyphLabel = {
              key: planet.key,
              labelVi: planet.nameVi,
              glyph: planet.glyph,
              known: planet.known,
            };

            return (
              <Card
                as="li"
                key={`${planet.key}#${index}`}
                padding="sm"
                className={cn(
                  "flex flex-col gap-3 transition-colors motion-reduce:transition-none",
                  isSelected && "bg-surface-raised ring-2 ring-accent-primary",
                  isRelated &&
                    !isSelected &&
                    "bg-surface-raised/40 ring-accent-primary/60 ring-1",
                )}
              >
                <div className="flex items-center justify-between">
                  {onSelect ? (
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => onSelect(planet.key)}
                      onPointerEnter={(e) => {
                        if (e.pointerType === "mouse") {
                          onPreview?.(planet.key, "hover", "enter");
                        }
                      }}
                      onPointerLeave={(e) => {
                        if (e.pointerType === "mouse") {
                          onPreview?.(planet.key, "hover", "leave");
                        }
                      }}
                      onFocus={() => onPreview?.(planet.key, "focus", "enter")}
                      onBlur={() => onPreview?.(planet.key, "focus", "leave")}
                      aria-label={`Chọn ${planet.nameVi}`}
                      className={cn(
                        "rounded inline-flex min-h-[44px] min-w-[44px] items-center text-left transition-colors motion-reduce:transition-none",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                        isSelected && "font-semibold",
                      )}
                    >
                      <PlanetGlyph planet={planetLabel} size="md" />
                    </button>
                  ) : (
                    <PlanetGlyph planet={planetLabel} size="md" />
                  )}
                </div>

                <dl className="grid grid-cols-2 gap-2 text-body-sm sm:grid-cols-4">
                  <div>
                    <dt className="text-body-xs text-subtle">Cung</dt>
                    <dd className="mt-0.5 font-medium text-primary">
                      <SignGlyph sign={planet.sign} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-body-xs text-subtle">Độ</dt>
                    <dd
                      className={cn(
                        "mt-0.5 font-medium text-primary",
                        TABLE_NUMERIC_FONT,
                      )}
                    >
                      {planet.degreeLabel ?? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Không có dữ liệu</span>
                        </>
                      )}
                    </dd>
                  </div>
                  {houseDataAvailable && (
                    <div>
                      <dt className="text-body-xs text-subtle">Nhà</dt>
                      <dd className="mt-0.5 font-medium text-primary">
                        {planet.houseNumber !== null ? (
                          <HouseBadge house={planet.houseNumber} />
                        ) : (
                          <>
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">
                              Không có dữ liệu nhà
                            </span>
                          </>
                        )}
                      </dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-body-xs text-subtle">Nghịch hành</dt>
                    <dd className="mt-0.5 font-medium text-primary">
                      {planet.isRetrograde ? (
                        <span className="inline-flex items-center gap-1 text-accent-primary">
                          <span aria-hidden="true" className="font-display">
                            {RETROGRADE_GLYPH}
                          </span>
                          <span>Nghịch hành</span>
                        </span>
                      ) : (
                        <span>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Không nghịch hành</span>
                        </span>
                      )}
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
