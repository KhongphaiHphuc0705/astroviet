import { randomUUID } from 'node:crypto';

import { Planet, PlanetProps } from '../../entities/planet.entity.js';
import { DataIntegrityError } from '../../errors/chart.errors.js';
import { RawEphemerisData } from '../../ports/ephemeris-provider.port.js';
import { PlanetCategory, PlanetName } from '../../types/chart.types.js';
import { ZodiacPosition } from '../../value-objects/zodiac-position.vo.js';

export class PlanetCalculator {
  /**
   * Calculates the positions and attributes of celestial bodies based on raw ephemeris data.
   */
  public static calculate(
    rawEphemeris: RawEphemerisData,
    includeOptionalPoints: PlanetName[] = [],
  ): Planet[] {
    const planets: Planet[] = [];

    const standardPlanets = [
      PlanetName.Sun,
      PlanetName.Moon,
      PlanetName.Mercury,
      PlanetName.Venus,
      PlanetName.Mars,
      PlanetName.Jupiter,
      PlanetName.Saturn,
      PlanetName.Uranus,
      PlanetName.Neptune,
      PlanetName.Pluto,
    ];

    const targetPoints = [...standardPlanets, ...includeOptionalPoints];

    for (const rawPlanet of rawEphemeris.planets) {
      if (!targetPoints.includes(rawPlanet.name)) {
        continue;
      }

      const category = this.getCategory(rawPlanet.name);
      const isRetrograde = rawPlanet.speed < 0;

      // ZodiacPosition.fromLongitude automatically normalizes the longitude to [0, 360)
      const zodiacPosition = ZodiacPosition.fromLongitude(rawPlanet.longitude);

      const props: PlanetProps = {
        id: randomUUID(),
        name: rawPlanet.name,
        category,
        longitude: zodiacPosition.longitude,
        latitude: rawPlanet.latitude,
        speed: rawPlanet.speed,
        isRetrograde,
        zodiacPosition,
        house: null, // Always null at this stage; ChartBuilder assigns house later
      };

      // Let the entity validate internal business rules (e.g. Sun/Moon cannot be retrograde)
      const planet = Planet.create(props);
      planets.push(planet);
    }

    return planets;
  }

  private static getCategory(name: PlanetName): PlanetCategory {
    switch (name) {
      case PlanetName.Sun:
      case PlanetName.Moon:
      case PlanetName.Mercury:
      case PlanetName.Venus:
      case PlanetName.Mars:
        return PlanetCategory.Personal;

      case PlanetName.Jupiter:
      case PlanetName.Saturn:
        return PlanetCategory.Social;

      case PlanetName.Uranus:
      case PlanetName.Neptune:
      case PlanetName.Pluto:
        return PlanetCategory.Outer;

      case PlanetName.Chiron:
      case PlanetName.NorthNode:
      case PlanetName.SouthNode:
      case PlanetName.Lilith:
        // As per M3 Decision, optional points are categorized as 'Outer' internally
        return PlanetCategory.Outer;

      default:
        throw new DataIntegrityError(`Unknown planet name: ${name}`);
    }
  }
}
