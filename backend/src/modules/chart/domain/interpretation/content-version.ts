import { InvalidContentVersionError } from '../errors/chart.errors.js';

const VERSION_REGEX = /^(0|[1-9]\d*)(\.(0|[1-9]\d*))*$/;

/**
 * Validates if the given string is a valid content version.
 * A valid version consists of one or more numeric segments separated by dots.
 * Segments cannot have leading zeros unless the segment is exactly "0".
 * Examples: "1.0", "2.10", "1.0.1", "1".
 * Invalid: "01.0", "1.", ".1", "1..0", "1.a".
 */
export function isValidContentVersion(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  return VERSION_REGEX.test(value.trim());
}

/**
 * Compares two content versions.
 * Returns -1 if a < b
 * Returns 1 if a > b
 * Returns 0 if a === b
 *
 * Missing segments are treated as '0' (e.g., '1.0' equals '1').
 * Throws InvalidContentVersionError if either version is invalid.
 */
export function compareContentVersion(a: string, b: string): -1 | 0 | 1 {
  const trimmedA = typeof a === 'string' ? a.trim() : a;
  const trimmedB = typeof b === 'string' ? b.trim() : b;

  if (!isValidContentVersion(trimmedA)) {
    throw new InvalidContentVersionError(`Invalid content version: ${a}`);
  }
  if (!isValidContentVersion(trimmedB)) {
    throw new InvalidContentVersionError(`Invalid content version: ${b}`);
  }

  const partsA = trimmedA.split('.');
  const partsB = trimmedB.split('.');

  const maxLength = Math.max(partsA.length, partsB.length);

  for (let i = 0; i < maxLength; i++) {
    const partA = partsA[i] || '0';
    const partB = partsB[i] || '0';

    if (partA === partB) {
      continue;
    }

    // Compare numerically without converting to Number to avoid precision loss on huge numbers
    if (partA.length < partB.length) return -1;
    if (partA.length > partB.length) return 1;

    // Lengths are equal, compare lexicographically
    if (partA < partB) return -1;
    if (partA > partB) return 1;
  }

  return 0;
}
