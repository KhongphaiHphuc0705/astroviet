import { PlanetName } from '../../domain/types/chart.types.js';

/**
 * Mapping between our Domain PlanetName and Swiss Ephemeris celestial body constants (SE_*).
 * SouthNode is intentionally excluded because Swiss Ephemeris calculates NorthNode,
 * and SouthNode is always calculated mathematically (NorthNode + 180 degrees).
 */
export const celestialBodyMapping: Record<Exclude<PlanetName, PlanetName.SouthNode>, number> = {
  [PlanetName.Sun]: 0, // SE_SUN
  [PlanetName.Moon]: 1, // SE_MOON
  [PlanetName.Mercury]: 2, // SE_MERCURY
  [PlanetName.Venus]: 3, // SE_VENUS
  [PlanetName.Mars]: 4, // SE_MARS
  [PlanetName.Jupiter]: 5, // SE_JUPITER
  [PlanetName.Saturn]: 6, // SE_SATURN
  [PlanetName.Uranus]: 7, // SE_URANUS
  [PlanetName.Neptune]: 8, // SE_NEPTUNE
  [PlanetName.Pluto]: 9, // SE_PLUTO
  [PlanetName.NorthNode]: 10, // SE_MEAN_NODE (Confirmed in Spec)
  [PlanetName.Lilith]: 12, // SE_MEAN_APOG (Confirmed in Spec)
  [PlanetName.Chiron]: 15, // SE_CHIRON
};
