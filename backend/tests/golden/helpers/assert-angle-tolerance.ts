import { circularDelta } from '../../../src/shared/utils/angle-comparison.util.js';

export function assertAngleWithinTolerance(
  actual: number,
  expected: number,
  tolerance: number,
  context: { fixtureId: string; field: string },
): void {
  const delta = circularDelta(actual, expected);

  if (delta > tolerance) {
    throw new Error(
      `Golden Reference Assertion Failed\n` +
        `  Fixture:   ${context.fixtureId}\n` +
        `  Field:     ${context.field}\n` +
        `  Expected:  ${expected.toFixed(6)}°\n` +
        `  Actual:    ${actual.toFixed(6)}°\n` +
        `  Delta:     ${delta.toFixed(6)}°  (circular distance)\n` +
        `  Tolerance: ${tolerance.toFixed(6)}°\n` +
        `  Exceeded by: ${(delta - tolerance).toFixed(6)}°`,
    );
  }
}
