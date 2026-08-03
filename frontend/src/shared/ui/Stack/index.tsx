import type { ElementType, HTMLAttributes } from "react";

import { cn } from "@shared/lib/cn";
import {
  resolveResponsiveProp,
  type ResponsiveProp,
  type Breakpoint,
} from "@shared/lib/resolveResponsiveProp";
import { GAP_MAPPING, type SpacingToken } from "@shared/lib/responsiveMappings";

type Direction = "vertical" | "horizontal";
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";

export interface StackProps extends HTMLAttributes<HTMLElement> {
  direction?: ResponsiveProp<Direction>;
  gap?: ResponsiveProp<SpacingToken>;
  align?: ResponsiveProp<Align>;
  justify?: ResponsiveProp<Justify>;
  wrap?: boolean;
  as?: ElementType;
}

const DIRECTION_MAPPING: Partial<
  Record<Breakpoint | "base", Record<Direction, string>>
> = {
  base: { vertical: "flex-col", horizontal: "flex-row" },
  sm: { vertical: "sm:flex-col", horizontal: "sm:flex-row" },
  md: { vertical: "md:flex-col", horizontal: "md:flex-row" },
  lg: { vertical: "lg:flex-col", horizontal: "lg:flex-row" },
  xl: { vertical: "xl:flex-col", horizontal: "xl:flex-row" },
  "2xl": { vertical: "2xl:flex-col", horizontal: "2xl:flex-row" },
};

const ALIGN_MAPPING: Partial<
  Record<Breakpoint | "base", Record<Align, string>>
> = {
  base: {
    start: "items-start",
    center: "items-center",
    end: "items-end",
    stretch: "items-stretch",
    baseline: "items-baseline",
  },
  sm: {
    start: "sm:items-start",
    center: "sm:items-center",
    end: "sm:items-end",
    stretch: "sm:items-stretch",
    baseline: "sm:items-baseline",
  },
  md: {
    start: "md:items-start",
    center: "md:items-center",
    end: "md:items-end",
    stretch: "md:items-stretch",
    baseline: "md:items-baseline",
  },
  lg: {
    start: "lg:items-start",
    center: "lg:items-center",
    end: "lg:items-end",
    stretch: "lg:items-stretch",
    baseline: "lg:items-baseline",
  },
  xl: {
    start: "xl:items-start",
    center: "xl:items-center",
    end: "xl:items-end",
    stretch: "xl:items-stretch",
    baseline: "xl:items-baseline",
  },
  "2xl": {
    start: "2xl:items-start",
    center: "2xl:items-center",
    end: "2xl:items-end",
    stretch: "2xl:items-stretch",
    baseline: "2xl:items-baseline",
  },
};

const JUSTIFY_MAPPING: Partial<
  Record<Breakpoint | "base", Record<Justify, string>>
> = {
  base: {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  },
  sm: {
    start: "sm:justify-start",
    center: "sm:justify-center",
    end: "sm:justify-end",
    between: "sm:justify-between",
    around: "sm:justify-around",
    evenly: "sm:justify-evenly",
  },
  md: {
    start: "md:justify-start",
    center: "md:justify-center",
    end: "md:justify-end",
    between: "md:justify-between",
    around: "md:justify-around",
    evenly: "md:justify-evenly",
  },
  lg: {
    start: "lg:justify-start",
    center: "lg:justify-center",
    end: "lg:justify-end",
    between: "lg:justify-between",
    around: "lg:justify-around",
    evenly: "lg:justify-evenly",
  },
  xl: {
    start: "xl:justify-start",
    center: "xl:justify-center",
    end: "xl:justify-end",
    between: "xl:justify-between",
    around: "xl:justify-around",
    evenly: "xl:justify-evenly",
  },
  "2xl": {
    start: "2xl:justify-start",
    center: "2xl:justify-center",
    end: "2xl:justify-end",
    between: "2xl:justify-between",
    around: "2xl:justify-around",
    evenly: "2xl:justify-evenly",
  },
};

export function Stack({
  direction = "vertical",
  gap,
  align,
  justify,
  wrap = false,
  as: Component = "div",
  className,
  children,
  ...props
}: StackProps) {
  return (
    <Component
      className={cn(
        "flex",
        resolveResponsiveProp(direction, DIRECTION_MAPPING),
        resolveResponsiveProp(gap, GAP_MAPPING),
        resolveResponsiveProp(align, ALIGN_MAPPING),
        resolveResponsiveProp(justify, JUSTIFY_MAPPING),
        wrap && "flex-wrap",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}
