import { Aspect } from '../../entities/aspect.entity.js';
import { Pattern } from '../../entities/pattern.entity.js';
import { Planet } from '../../entities/planet.entity.js';

export class PatternCalculator {
  /**
   * Calculates chart patterns (e.g., Grand Trine, T-Square, Stellium).
   *
   * NOTE: As per Domain Specification Decision D-14, pattern calculation is DEFERRED.
   * This calculator acts as a stub and always returns an empty array.
   *
   * @param planets The list of calculated planets in the chart.
   * @param aspects The list of calculated aspects between planets.
   * @returns An empty array of Patterns.
   */
  public static calculate(_planets: Planet[], _aspects: Aspect[]): Pattern[] {
    return [];
  }
}
