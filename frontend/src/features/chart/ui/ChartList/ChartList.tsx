import { cn } from "@shared/lib/cn";
import { Grid } from "@shared/ui/Grid";

import type { ChartSummary } from "../../api/types";

import { ChartListItem } from "./ChartListItem";
import type { ChartProfileLookup } from "./profileLabel";

export interface ChartListProps {
  items: ChartSummary[];
  lookup: ChartProfileLookup;
  className?: string;
}

export function ChartList({ items, lookup, className }: ChartListProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <Grid
      as="ul"
      role="list"
      columns={{ xs: "1", md: "2", lg: "3" }}
      className={cn("gap-6", className)}
    >
      {items.map((item) => (
        <ChartListItem key={item.id} item={item} lookup={lookup} />
      ))}
    </Grid>
  );
}
