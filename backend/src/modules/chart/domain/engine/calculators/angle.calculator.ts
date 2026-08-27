import { randomUUID } from 'node:crypto';

import { Angle, AngleProps } from '../../entities/angle.entity.js';
import { HouseCalculationResult } from '../../ports/ephemeris-provider.port.js';

export class AngleCalculator {
  /**
   * Calculates the 4 principal astrological angles (Ascendant, Midheaven, Descendant, Imum Coeli)
   * based on the ephemeris calculation result.
   * Returns an empty array if the house calculation did not converge.
   *
   * Note: The generation of the Warning (HOUSE_SYSTEM_NOT_CONVERGING) is delegated to
   * the ChartBuilder, which orchestrates the pipeline.
   */
  public static calculate(calculationResult: HouseCalculationResult): Angle[] {
    if (calculationResult.status === 'not_convergent') {
      return [];
    }

    const { ascendant, midheaven } = calculationResult.data;
    const angles: Angle[] = [];

    // Calculate all 4 principal angles based on standard astrology geometry
    const ascDegree = this.normalize(ascendant);
    const mcDegree = this.normalize(midheaven);

    // Descendant is directly opposite the Ascendant
    const descDegree = this.normalize(ascendant + 180);

    // Imum Coeli (IC/Nadir) is directly opposite the Midheaven
    const icDegree = this.normalize(midheaven + 180);

    const angleConfigs = [
      { type: 'Ascendant' as const, longitude: ascDegree },
      { type: 'Midheaven' as const, longitude: mcDegree },
      { type: 'Descendant' as const, longitude: descDegree },
      { type: 'ImumCoeli' as const, longitude: icDegree },
    ];

    for (const config of angleConfigs) {
      const props: AngleProps = {
        id: randomUUID(),
        type: config.type,
        longitude: config.longitude,
      };

      angles.push(Angle.create(props));
    }

    return angles;
  }

  /**
   * Normalizes a degree to be strictly within [0, 360).
   * Safe for negative numbers and preserves precision if already normalized.
   */
  private static normalize(degree: number): number {
    if (degree >= 0 && degree < 360) {
      return degree;
    }
    return ((degree % 360) + 360) % 360;
  }
}
