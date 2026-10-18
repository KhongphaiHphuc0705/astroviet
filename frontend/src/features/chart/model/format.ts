export const DEGREE_SIGN = "\u00B0";
export const MINUTE_SIGN = "\u2032";
export const EPS_MINUTES = 1e-9;

/**
 * Formats a decimal degree value into a canonical "D°MM′" string.
 *
 * Rules:
 * - Valid domain: finite number in [0, 360).
 * - Invalid, negative, >= 360, NaN, +-Infinity, null, undefined -> null.
 * - Precision: truncated to whole minutes (floor) after adding EPS_MINUTES.
 * - Minutes: always 2 digits with leading zero ("00".."59").
 * - Seconds: not displayed (per decision D-M2-1 and D-M2-2).
 * - Pure arithmetic, no locale or Intl dependency.
 */
export function formatDegreeMinute(
  value: number | null | undefined,
): string | null {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value >= 360
  ) {
    return null;
  }

  const totalMinutes = Math.floor(value * 60 + EPS_MINUTES);
  const degrees = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${degrees}${DEGREE_SIGN}${minutes.toString().padStart(2, "0")}${MINUTE_SIGN}`;
}

/**
 * Extracts the whole degree part from a "D°MM′" formatted degree label string.
 * Returns "D°", or null if input is null/undefined or not conforming to "D°MM′".
 * Decision D-S45-04: formats whole degree on wheel without mutating ViewModel.
 */
export function formatDegreeOnly(
  degreeLabel: string | null | undefined,
): string | null {
  if (typeof degreeLabel !== "string") {
    return null;
  }
  const degreeIndex = degreeLabel.indexOf(DEGREE_SIGN);
  if (degreeIndex === -1) {
    return null;
  }
  const degPart = degreeLabel.slice(0, degreeIndex);
  if (!/^\d+$/.test(degPart)) {
    return null;
  }
  return `${degPart}${DEGREE_SIGN}`;
}
