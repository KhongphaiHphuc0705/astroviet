import { Calendar } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@shared/ui/Badge";
import { Button } from "@shared/ui/Button";
import { Card } from "@shared/ui/Card";
import { Skeleton } from "@shared/ui/Skeleton";

import type { ChartSummary } from "../../api/types";
import { resolveHouseSystem } from "../../model/labels";
import { formatCalculatedAt } from "../ChartViewerShell/formatCalculatedAt";

import {
  buildChartItemAriaLabel,
  resolveChartProfileLabel,
  type ChartProfileLookup,
} from "./profileLabel";

export interface ChartListItemProps {
  item: ChartSummary;
  lookup: ChartProfileLookup;
}

export function ChartListItem({ item, lookup }: ChartListItemProps) {
  const { kind, text: profileLabel } = resolveChartProfileLabel(
    item.birthProfileId,
    lookup,
  );
  const houseSystemInfo = resolveHouseSystem(item.houseSystem);
  const formattedDate = formatCalculatedAt(item.calculatedAt);
  const ariaLabel = buildChartItemAriaLabel(profileLabel, formattedDate);

  return (
    <Card as="li" className="flex flex-col">
      <div className="mb-4 flex-1">
        <div className="flex items-start justify-between gap-2">
          {kind === "loading" ? (
            <h2
              className="truncate text-heading-sm font-semibold text-primary"
              title={profileLabel}
            >
              <span className="sr-only">{profileLabel}</span>
              <Skeleton className="w-36 h-6" aria-hidden="true" />
            </h2>
          ) : (
            <h2
              className="truncate text-heading-sm font-semibold text-primary"
              title={profileLabel}
            >
              {profileLabel}
            </h2>
          )}
          <Badge variant="outline" className="shrink-0">
            {houseSystemInfo.labelVi}
          </Badge>
        </div>

        <div className="mt-4 space-y-2 text-body-sm text-muted">
          <p className="flex items-center gap-2">
            <Calendar
              size={14}
              className="shrink-0 text-accent-primary"
              aria-hidden="true"
            />
            <time dateTime={item.calculatedAt}>{formattedDate}</time>
          </p>
        </div>
      </div>

      <div className="mt-auto flex justify-end border-t border-subtle pt-4">
        <Button
          as={Link}
          to={`/app/charts/${encodeURIComponent(item.id)}`}
          variant="secondary"
          size="sm"
          aria-label={ariaLabel}
        >
          Xem lá số
        </Button>
      </div>
    </Card>
  );
}
