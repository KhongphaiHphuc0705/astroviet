/**
 * The convergence latitude threshold.
 *
 * Sourced from Natal Chart Domain Spec Section 15.3 and Technical Spike Section 7.1.
 * Swiss Ephemeris does not explicitly signal a non-convergence or return an error/NaN
 * when calculating houses (like Placidus) at extreme latitudes. Instead, the results
 * degenerate silently into non-astrological equidistant cusps.
 * Therefore, we must proactively check the latitude before delegating to the library.
 */
export const CONVERGENCE_LATITUDE_THRESHOLD = 66.5;

/**
 * Evaluates whether a given latitude exceeds the safe convergence limit for house systems.
 *
 * @param latitude The geographical latitude in degrees
 * @returns boolean True if the latitude exceeds the convergence limit
 */
export function isAboveConvergenceLatitude(latitude: number): boolean {
  return Math.abs(latitude) > CONVERGENCE_LATITUDE_THRESHOLD;
}
