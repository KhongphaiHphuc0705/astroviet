export type Breakpoint = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export type ResponsiveProp<T extends string | number> =
  T | Partial<Record<Breakpoint, T>>;

/**
 * Resolves a responsive property to a string of Tailwind classes.
 * `mappings` should be an object where keys are breakpoints (or 'base' for single/xs value),
 * and values are objects mapping the prop value to the exact Tailwind class.
 */
export function resolveResponsiveProp<T extends string | number>(
  prop: ResponsiveProp<T> | undefined,
  mappings: Partial<Record<Breakpoint | "base", Record<T, string>>>,
): string {
  if (prop === undefined || prop === null) return "";

  if (typeof prop !== "object") {
    return mappings.base?.[prop] || "";
  }

  return Object.entries(prop)
    .map(([bp, value]) => {
      const breakpoint = bp as Breakpoint;
      // 'xs' maps to base styling (mobile-first)
      if (breakpoint === "xs") {
        return mappings.base?.[value as T] || "";
      }
      return mappings[breakpoint]?.[value as T] || "";
    })
    .filter(Boolean)
    .join(" ");
}
