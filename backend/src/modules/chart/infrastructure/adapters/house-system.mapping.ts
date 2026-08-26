import { HouseSystem } from '../../domain/types/chart.types.js';

/**
 * Mapping between our Domain HouseSystem and Swiss Ephemeris house system codes.
 * 'P' = Placidus
 * 'W' = Whole Sign
 */
export const houseSystemMapping: Record<HouseSystem, string> = {
  [HouseSystem.Placidus]: 'P',
  [HouseSystem.WholeSign]: 'W',
};
