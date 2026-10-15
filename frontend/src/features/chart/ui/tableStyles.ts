export type TableDensity = "comfortable" | "compact";

/**
 * Standard table cell padding classes matching UI Spec §6.2:
 * - comfortable: space-3 (px-3 py-3)
 * - compact: space-2 (px-2 py-2)
 */
export const TABLE_CELL_PADDING: Record<TableDensity, string> = {
  comfortable: "px-3 py-3",
  compact: "px-2 py-2",
};

/**
 * Utility classes for numerical tabular data (monospace font + tabular figures)
 */
export const TABLE_NUMERIC_FONT = "font-data tabular-nums whitespace-nowrap";

/**
 * Standard utility helper to resolve table cell density classes
 */
export function getTableCellPadding(
  density: TableDensity = "comfortable",
): string {
  return TABLE_CELL_PADDING[density] ?? TABLE_CELL_PADDING.comfortable;
}
