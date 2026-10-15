/**
 * Pure geometry primitives and constants for Chart Wheel rendering.
 * Pure mathematical functions independent of React, DOM, and ASTRO domain logic.
 */

export const WHEEL_VIEWBOX_SIZE = 600;
export const WHEEL_CENTER = 300;

export const WHEEL_RADII = {
  signOuter: 260,
  signInner: 225,
  tickOuter: 225,
  tickInner: 215,
  houseOuter: 215,
  houseInner: 175,
  angleLabel: 282,
} as const;

export interface Point {
  x: number;
  y: number;
}

/**
 * Rounds a coordinate to at most 3 decimal places and normalizes -0 to 0.
 */
export function roundCoord(n: number): number {
  if (!Number.isFinite(n)) {
    throw new RangeError("Coordinate must be a finite number");
  }
  return Math.round(n * 1000) / 1000 + 0;
}

/**
 * Normalizes any longitude degree value to the half-open interval [0, 360).
 * Throws RangeError if deg is not finite (NaN, Infinity).
 */
export function normalizeLongitude(deg: number): number {
  if (!Number.isFinite(deg)) {
    throw new RangeError("Longitude must be a finite number");
  }
  const normalized = ((deg % 360) + 360) % 360;
  // Account for floating point rounding at 360 boundary
  return normalized >= 360 ? 0 : normalized + 0;
}

/**
 * Converts a zodiac longitude to screen angle theta in SVG coordinates:
 * theta = normalize(180 + (lambda - rotation))
 *
 * Screen angle conventions:
 * - Counter-clockwise from +x axis.
 * - ASC (lambda = rotation) maps to 180 degrees (left side).
 * - MC (lambda = rotation + 270) maps to 90 degrees (top side).
 */
export function toScreenAngle(lambda: number, rotation: number): number {
  if (!Number.isFinite(lambda) || !Number.isFinite(rotation)) {
    throw new RangeError("lambda and rotation must be finite numbers");
  }
  return normalizeLongitude(180 + (lambda - rotation));
}

/**
 * Converts polar coordinates (r, thetaDeg) to SVG Cartesian coordinates (x, y)
 * centered at (cx, cy).
 * Note: In SVG screen coordinates, y increases downward, so y = cy - r * sin(theta).
 */
export function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  thetaDeg: number,
): Point {
  if (
    !Number.isFinite(cx) ||
    !Number.isFinite(cy) ||
    !Number.isFinite(r) ||
    !Number.isFinite(thetaDeg)
  ) {
    throw new RangeError("Parameters must be finite numbers");
  }
  if (r < 0) {
    throw new RangeError("Radius r must be non-negative");
  }
  if (r === 0) {
    return { x: roundCoord(cx), y: roundCoord(cy) };
  }

  const rad = (thetaDeg * Math.PI) / 180;
  const x = cx + r * Math.cos(rad);
  const y = cy - r * Math.sin(rad);

  return {
    x: roundCoord(x),
    y: roundCoord(y),
  };
}

/**
 * Generates an SVG path data string for an annular sector (donut slice).
 * Goes counter-clockwise from startAngleDeg spanning spanDeg.
 *
 * Path commands:
 * 1. Move to start on outer radius P1.
 * 2. Arc on outer radius to P2 (sweep=0).
 * 3. Line to inner radius P3.
 * 4. Arc on inner radius back to P4 (sweep=1).
 * 5. Close path (Z).
 */
export function arcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngleDeg: number,
  spanDeg: number,
): string {
  if (
    !Number.isFinite(cx) ||
    !Number.isFinite(cy) ||
    !Number.isFinite(rOuter) ||
    !Number.isFinite(rInner) ||
    !Number.isFinite(startAngleDeg) ||
    !Number.isFinite(spanDeg)
  ) {
    throw new RangeError("Parameters must be finite numbers");
  }
  if (rOuter <= rInner || rInner < 0) {
    throw new RangeError(
      "rOuter must be greater than rInner and rInner must be non-negative",
    );
  }
  if (spanDeg <= 0 || spanDeg >= 360) {
    throw new RangeError("spanDeg must be strictly in (0, 360)");
  }

  const endAngleDeg = startAngleDeg + spanDeg;
  const p1 = polarToCartesian(cx, cy, rOuter, startAngleDeg);
  const p2 = polarToCartesian(cx, cy, rOuter, endAngleDeg);
  const p3 = polarToCartesian(cx, cy, rInner, endAngleDeg);
  const p4 = polarToCartesian(cx, cy, rInner, startAngleDeg);

  const largeArcFlag = spanDeg > 180 ? 1 : 0;

  return `M ${p1.x} ${p1.y} A ${rOuter} ${rOuter} 0 ${largeArcFlag} 0 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${rInner} ${rInner} 0 ${largeArcFlag} 1 ${p4.x} ${p4.y} Z`;
}

/**
 * Computes the mid-angle longitude between two consecutive boundary longitudes
 * traveling in the positive (counter-clockwise) direction.
 * Accurately handles wrap-around at 0/360 degrees.
 */
export function sectorMidAngle(lambdaStart: number, lambdaEnd: number): number {
  if (!Number.isFinite(lambdaStart) || !Number.isFinite(lambdaEnd)) {
    throw new RangeError("Parameters must be finite numbers");
  }
  const start = normalizeLongitude(lambdaStart);
  const end = normalizeLongitude(lambdaEnd);
  const span = normalizeLongitude(end - start);

  return normalizeLongitude(start + span / 2);
}
