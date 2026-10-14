import { useId, type ReactNode } from "react";

import { cn } from "@shared/lib/cn";
import { Badge } from "@shared/ui/Badge";
import { Card } from "@shared/ui/Card";

import type { AngleVM, HouseVM } from "../../model/chartViewModel";
import { HouseBadge, SignGlyph } from "../ChartBadges";
import {
  getTableCellPadding,
  TABLE_NUMERIC_FONT,
  type TableDensity,
} from "../tableStyles";

export interface HouseTableProps {
  houses: HouseVM[];
  angles: AngleVM[];
  houseDataAvailable: boolean;
  hasAngles: boolean;
  houseSystemLabel: string;
  unavailableContent?: ReactNode;
  layout?: "table" | "cards";
  density?: TableDensity;
  className?: string;
}

export function HouseTable({
  houses,
  angles,
  houseDataAvailable,
  hasAngles,
  houseSystemLabel,
  unavailableContent,
  layout = "table",
  density = "comfortable",
  className,
}: HouseTableProps) {
  const headingId = useId();
  const cellPadding = getTableCellPadding(density);
  const showAngles = hasAngles && angles.length > 0;

  return (
    <section aria-labelledby={headingId} className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between gap-2">
        <h2
          id={headingId}
          className="text-heading-sm font-semibold text-primary"
        >
          Nhà và các góc
        </h2>
        <Badge variant="neutral" size="sm">
          {houseSystemLabel}
        </Badge>
      </div>

      {houseDataAvailable ? (
        layout === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-body-sm text-primary">
              <caption className="sr-only">
                Nhà theo hệ {houseSystemLabel} — Natal Chart, {houses.length}{" "}
                hàng
              </caption>
              <thead>
                <tr className="text-body-xs border-b border-subtle font-medium uppercase text-subtle">
                  <th scope="col" className={cn(cellPadding, "text-left")}>
                    Nhà
                  </th>
                  <th scope="col" className={cn(cellPadding, "text-left")}>
                    Cusp (độ)
                  </th>
                  <th scope="col" className={cn(cellPadding, "text-left")}>
                    Cung
                  </th>
                </tr>
              </thead>
              <tbody>
                {houses.map((house) => (
                  <tr
                    key={house.number}
                    className="hover:bg-surface-hover/50 border-b border-subtle transition-colors"
                  >
                    <th
                      scope="row"
                      className={cn(cellPadding, "font-medium text-primary")}
                    >
                      <HouseBadge
                        house={house.number}
                        ariaLabel={house.ariaLabel}
                      />
                    </th>
                    <td className={cn(cellPadding, TABLE_NUMERIC_FONT)}>
                      {house.degreeLabel ?? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Không có dữ liệu</span>
                        </>
                      )}
                    </td>
                    <td className={cellPadding}>
                      <SignGlyph sign={house.sign} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            {houses.map((house) => (
              <Card
                as="li"
                key={house.number}
                padding="sm"
                className="flex flex-col gap-2"
              >
                <div>
                  <HouseBadge
                    house={house.number}
                    ariaLabel={house.ariaLabel}
                    size="md"
                  />
                </div>
                <dl className="grid grid-cols-2 gap-2 text-body-sm">
                  <div>
                    <dt className="text-body-xs text-subtle">Cusp</dt>
                    <dd
                      className={cn(
                        "mt-0.5 font-medium text-primary",
                        TABLE_NUMERIC_FONT,
                      )}
                    >
                      {house.degreeLabel ?? (
                        <>
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">Không có dữ liệu</span>
                        </>
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-body-xs text-subtle">Cung</dt>
                    <dd className="mt-0.5 font-medium text-primary">
                      <SignGlyph sign={house.sign} />
                    </dd>
                  </div>
                </dl>
              </Card>
            ))}
          </ul>
        )
      ) : (
        (unavailableContent ?? null)
      )}

      {showAngles && (
        <div className="space-y-3 pt-2">
          <h3 className="text-body-base font-semibold text-primary">
            Các góc chính
          </h3>
          {layout === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-body-sm text-primary">
                <caption className="sr-only">
                  Các góc chính — Natal Chart, {angles.length} hàng
                </caption>
                <thead>
                  <tr className="text-body-xs border-b border-subtle font-medium uppercase text-subtle">
                    <th scope="col" className={cn(cellPadding, "text-left")}>
                      Góc
                    </th>
                    <th scope="col" className={cn(cellPadding, "text-left")}>
                      Cung
                    </th>
                    <th scope="col" className={cn(cellPadding, "text-left")}>
                      Độ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {angles.map((angle) => (
                    <tr
                      key={angle.key}
                      className="hover:bg-surface-hover/50 border-b border-subtle transition-colors"
                    >
                      <th
                        scope="row"
                        className={cn(cellPadding, "font-medium text-primary")}
                      >
                        <span className="font-medium text-primary">
                          {angle.shortLabel && (
                            <span className="mr-1.5 font-bold">
                              {angle.shortLabel}
                            </span>
                          )}
                          <span className="text-secondary">
                            {angle.labelVi}
                          </span>
                        </span>
                      </th>
                      <td className={cellPadding}>
                        <SignGlyph sign={angle.sign} />
                      </td>
                      <td className={cn(cellPadding, TABLE_NUMERIC_FONT)}>
                        {angle.degreeLabel ?? (
                          <>
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">Không có dữ liệu</span>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {angles.map((angle) => (
                <Card
                  as="li"
                  key={angle.key}
                  padding="sm"
                  className="flex flex-col gap-2"
                >
                  <div className="font-medium text-primary">
                    {angle.shortLabel && (
                      <span className="mr-1.5 font-bold">
                        {angle.shortLabel}
                      </span>
                    )}
                    <span className="text-secondary">{angle.labelVi}</span>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-body-sm">
                    <div>
                      <dt className="text-body-xs text-subtle">Cung</dt>
                      <dd className="mt-0.5 font-medium text-primary">
                        <SignGlyph sign={angle.sign} />
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
                        {angle.degreeLabel ?? (
                          <>
                            <span aria-hidden="true">—</span>
                            <span className="sr-only">Không có dữ liệu</span>
                          </>
                        )}
                      </dd>
                    </div>
                  </dl>
                </Card>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
