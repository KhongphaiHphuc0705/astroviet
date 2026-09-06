/**
 * Utility functions for angle comparison.
 * Ensures consistent handling of circular values like celestial longitudes (0 to 360 degrees).
 */

/**
 * Normalizes an angle in degrees to be within [0, 360).
 * Examples:
 * - normalizeAngle(361) === 1
 * - normalizeAngle(-1) === 359
 *
 * @param degrees The angle in degrees.
 * @returns The normalized angle.
 */
export function normalizeAngle(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

/**
 * Calculates the shortest distance (delta) between two angles in degrees.
 * Examples:
 * - circularDelta(359.999, 0.001) ≈ 0.002
 * - circularDelta(10, 350) === 20
 *
 * @param a The first angle in degrees.
 * @param b The second angle in degrees.
 * @returns The shortest difference between the two angles in degrees.
 */
export function circularDelta(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, 360 - diff);
}

/**
 * Checks if the actual angle is within the specified tolerance of the expected angle.
 *
 * @param actual The actual angle in degrees.
 * @param expected The expected angle in degrees.
 * @param toleranceDegrees The allowed tolerance in degrees.
 * @returns True if the actual angle is within the tolerance of the expected angle.
 */
export function isWithinAngleTolerance(
  actual: number,
  expected: number,
  toleranceDegrees: number,
): boolean {
  return circularDelta(actual, expected) <= toleranceDegrees;
}
