import { randomUUID } from 'node:crypto';

import { House, HouseProps } from '../../entities/house.entity.js';
import { HouseCalculationResult } from '../../ports/ephemeris-provider.port.js';
import { HouseSystem } from '../../types/chart.types.js';

export class HouseCalculator {
  /**
   * Calculates the 12 astrological houses based on the ephemeris calculation result.
   * Returns an empty array if the house calculation did not converge (e.g. extreme latitudes).
   *
   * Note: The generation of the Warning (HOUSE_SYSTEM_NOT_CONVERGING) is delegated to
   * the ChartBuilder, which orchestrates the pipeline and assembles the warnings.
   */
  public static calculate(
    calculationResult: HouseCalculationResult,
    houseSystem: HouseSystem,
  ): House[] {
    if (calculationResult.status === 'not_convergent') {
      return [];
    }

    const houses: House[] = [];
    const { cusps, ascendant } = calculationResult.data;

    for (let i = 0; i < 12; i++) {
      const houseNumber = i + 1;

      // Domain Spec §16: House 1 cusp must equal Ascendant longitude.
      // We use 'ascendant' directly to avoid floating point discrepancies from 'cusps[0]'
      let cuspDegree = houseNumber === 1 ? ascendant : cusps[i];
      if (cuspDegree === undefined) {
        throw new Error(`Missing cusp data for house ${houseNumber}`);
      }

      // Safe normalization just in case, only apply if outside [0, 360) to prevent precision loss
      if (cuspDegree < 0 || cuspDegree >= 360) {
        cuspDegree = ((cuspDegree % 360) + 360) % 360;
      }

      const props: HouseProps = {
        id: randomUUID(),
        number: houseNumber,
        cuspDegree,
        houseSystem,
      };

      const house = House.create(props);
      houses.push(house);
    }

    return houses;
  }
}
