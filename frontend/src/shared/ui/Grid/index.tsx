import type { ElementType, HTMLAttributes, CSSProperties } from "react";

import { cn } from "@shared/lib/cn";
import {
  resolveResponsiveProp,
  type ResponsiveProp,
} from "@shared/lib/resolveResponsiveProp";
import {
  GAP_MAPPING,
  COL_GAP_MAPPING,
  ROW_GAP_MAPPING,
  COLUMNS_MAPPING,
  type SpacingToken,
} from "@shared/lib/responsiveMappings";

type GridCols =
  "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "11" | "12";

export interface GridProps extends HTMLAttributes<HTMLElement> {
  columns?: ResponsiveProp<GridCols> | "auto-fit";
  minItemWidth?: string; // e.g. "200px" or "var(--space-20)", required if columns="auto-fit"
  gap?: ResponsiveProp<SpacingToken>;
  columnGap?: ResponsiveProp<SpacingToken>;
  rowGap?: ResponsiveProp<SpacingToken>;
  as?: ElementType;
}

export function Grid({
  columns,
  minItemWidth,
  gap,
  columnGap,
  rowGap,
  as: Component = "div",
  className,
  style,
  children,
  ...props
}: GridProps) {
  const isAutoFit = columns === "auto-fit";

  const gridStyle: CSSProperties =
    isAutoFit && minItemWidth
      ? {
          ...style,
          gridTemplateColumns: `repeat(auto-fit, minmax(${minItemWidth}, 1fr))`,
        }
      : style || {};

  return (
    <Component
      className={cn(
        "grid",
        !isAutoFit && resolveResponsiveProp(columns, COLUMNS_MAPPING),
        resolveResponsiveProp(gap, GAP_MAPPING),
        resolveResponsiveProp(columnGap, COL_GAP_MAPPING),
        resolveResponsiveProp(rowGap, ROW_GAP_MAPPING),
        className,
      )}
      style={Object.keys(gridStyle).length > 0 ? gridStyle : undefined}
      {...props}
    >
      {children}
    </Component>
  );
}
